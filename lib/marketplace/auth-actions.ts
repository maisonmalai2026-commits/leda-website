"use server";

// ============================================================================
// Auth + profile server actions.
//
// These power the real account system (email/password + Google OAuth) on top of
// the existing Supabase scaffolding. Like the rest of the marketplace they are
// DEMO-SAFE: when Supabase is not configured every action returns a friendly
// { ok:false, demo:true } envelope instead of crashing. No secrets are ever
// touched here — getServerSupabase() uses the anon key and is RLS-bound.
//
// NOTE: this file is "use server" — it may only export async functions, and
// every function returns Promise<ActionResult<...>> and never throws.
// ============================================================================

import { revalidatePath } from "next/cache";

import { APP_URL, isSupabaseConfigured } from "@/lib/marketplace/config";
import { getServerSupabase } from "@/lib/marketplace/supabase/server";
import type { ActionResult } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Standard "Supabase not configured" envelope returned in demo mode. */
function demoResult<T = undefined>(): ActionResult<T> {
  return {
    ok: false,
    demo: true,
    message: "Connect Supabase to enable real accounts.",
  };
}

/** Normalizes a Supabase auth/db error into a friendly ActionResult. */
function errorResult<T = undefined>(
  message: string,
  error = "auth_error",
): ActionResult<T> {
  return { ok: false, error, message };
}

/** Handle validation: lowercase alphanumerics + underscore, 2..32 chars. */
const HANDLE_RE = /^[a-z0-9_]{2,32}$/;

/** Basic email shape check so we fail fast with a clear message. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

/**
 * Create a new account with email + password. A `profiles` row is auto-created
 * by a DB trigger on signup. When email confirmation is enabled the user must
 * confirm before a session exists — we surface that with a clear message.
 */
export async function signUpWithEmail(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return demoResult();

  const email = (input?.email ?? "").trim();
  const password = input?.password ?? "";
  const displayName = (input?.displayName ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return errorResult("Please enter a valid email address.", "bad_request");
  }
  if (password.length < 8) {
    return errorResult(
      "Password must be at least 8 characters.",
      "bad_request",
    );
  }

  const supabase = await getServerSupabase();
  if (!supabase) return demoResult();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback`,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    return errorResult(error.message || "Could not create your account.");
  }

  // When email confirmation is ON, Supabase returns a user with no active
  // session — the user must click the link in their inbox first.
  if (!data.session) {
    return {
      ok: true,
      message:
        "Check your email to confirm your account, then sign in.",
    };
  }

  // Confirmation off → the user is signed in immediately.
  revalidatePath("/", "layout");
  return { ok: true, message: "Welcome to Leda! Your account is ready." };
}

/** Sign in with an existing email + password. */
export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return demoResult();

  const email = (input?.email ?? "").trim();
  const password = input?.password ?? "";

  if (!EMAIL_RE.test(email) || password.length === 0) {
    return errorResult("Enter your email and password.", "bad_request");
  }

  const supabase = await getServerSupabase();
  if (!supabase) return demoResult();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return errorResult(
      error.message || "Invalid email or password.",
      "invalid_credentials",
    );
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Signed in." };
}

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

/**
 * Begin a Google OAuth flow. Returns the provider authorization URL so the
 * CLIENT can perform the redirect (window.location.assign). The provider sends
 * the user back to /auth/callback which exchanges the code for a session.
 */
export async function signInWithGoogle(): Promise<ActionResult<{ url: string }>> {
  if (!isSupabaseConfigured()) return demoResult();

  const supabase = await getServerSupabase();
  if (!supabase) return demoResult();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${APP_URL}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    return errorResult(
      error?.message || "Could not start Google sign-in.",
      "oauth_error",
    );
  }

  return { ok: true, data: { url: data.url } };
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

/** Sign the current user out and clear the session cookies. */
export async function signOut(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return demoResult();

  const supabase = await getServerSupabase();
  if (!supabase) return demoResult();

  const { error } = await supabase.auth.signOut();
  if (error) {
    return errorResult(error.message || "Could not sign you out.");
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Signed out." };
}

// ---------------------------------------------------------------------------
// Profile updates
// ---------------------------------------------------------------------------

/**
 * Update the signed-in user's own profile row. Only the safe, user-editable
 * fields are accepted — role, is_verified_creator, creator_status, etc. can
 * NEVER be changed here (and RLS enforces ownership server-side regardless).
 */
export async function updateProfile(input: {
  display_name?: string;
  handle?: string;
  bio?: string;
  website_url?: string;
  avatar_url?: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return demoResult();

  const supabase = await getServerSupabase();
  if (!supabase) return demoResult();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return errorResult("You must be signed in to update your profile.", "auth_required");
  }

  // Build a whitelist of only the editable columns that were provided.
  const updates: Record<string, string | null> = {};

  if (typeof input?.handle === "string") {
    const handle = input.handle.trim().toLowerCase();
    if (!HANDLE_RE.test(handle)) {
      return errorResult(
        "Handle must be 2–32 characters: lowercase letters, numbers, or _.",
        "bad_request",
      );
    }
    updates.handle = handle;
  }

  if (typeof input?.display_name === "string") {
    const displayName = input.display_name.trim();
    if (displayName.length === 0) {
      return errorResult("Display name cannot be empty.", "bad_request");
    }
    updates.display_name = displayName;
  }

  if (typeof input?.bio === "string") {
    const bio = input.bio.trim();
    updates.bio = bio.length > 0 ? bio : null;
  }

  if (typeof input?.website_url === "string") {
    const website = input.website_url.trim();
    updates.website_url = website.length > 0 ? website : null;
  }

  if (typeof input?.avatar_url === "string") {
    const avatar = input.avatar_url.trim();
    updates.avatar_url = avatar.length > 0 ? avatar : null;
  }

  if (Object.keys(updates).length === 0) {
    return errorResult("Nothing to update.", "bad_request");
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    // A unique-violation on handle is the most likely real-world failure.
    const taken = /duplicate|unique/i.test(error.message);
    return errorResult(
      taken
        ? "That handle is already taken. Try another."
        : error.message || "Could not save your profile.",
      taken ? "handle_taken" : "db_error",
    );
  }

  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}
