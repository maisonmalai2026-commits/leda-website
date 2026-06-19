import "server-only";

// ============================================================================
// Marketplace auth + role helpers (server-only).
//
// Two modes:
//   - DEMO MODE (no Supabase env): the current "session" is read from a plain
//     cookie (leda_demo_role) so gated pages can be explored locally. The
//     returned user is always synthetic and flagged is_demo:true.
//   - SUPABASE MODE: the session comes from the real auth user, and the profile
//     row is loaded from the database.
//
// Role helpers (roleRank/roleAtLeast) and the require* guards are pure and work
// in either mode. The require* functions return SessionUser | null; callers are
// responsible for redirecting/erroring on null.
// ============================================================================

import { cookies } from "next/headers";

import { isSupabaseConfigured } from "@/lib/marketplace/config";
import { getServerSupabase } from "@/lib/marketplace/supabase/server";
import {
  USER_ROLES,
  type Profile,
  type Role,
  type SessionUser,
  type UserRole,
} from "@/lib/marketplace/types";

/** Cookie that drives demo-mode role impersonation. Read by client + server. */
export const DEMO_ROLE_COOKIE = "leda_demo_role";

// ---------------------------------------------------------------------------
// Role ranking
// ---------------------------------------------------------------------------

/** Total ordering over roles: guest < user < creator < moderator < admin. */
const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  user: 1,
  creator: 2,
  moderator: 3,
  admin: 4,
};

/** Numeric rank for a role (higher = more privileged). */
export function roleRank(role: Role): number {
  return ROLE_RANK[role] ?? 0;
}

/** True when `role` is at least as privileged as `min`. */
export function roleAtLeast(role: Role, min: Role): boolean {
  return roleRank(role) >= roleRank(min);
}

/** Type guard: is the given string a real (non-guest) user role? */
function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Demo session
// ---------------------------------------------------------------------------

/** Builds a stable synthetic profile/session for the given demo role. */
function buildDemoUser(role: UserRole): SessionUser {
  const now = "2024-01-01T00:00:00.000Z";
  const profile: Profile = {
    id: "demo-user",
    handle: "you_demo",
    display_name: "You (Demo)",
    bio: "Demo account for exploring gated pages locally.",
    avatar_url: null,
    website_url: null,
    profile_visibility: "public",
    role,
    // Creators (and above) get an active creator status so creator surfaces
    // render; plain users do not.
    creator_status: roleAtLeast(role, "creator") ? "active" : "none",
    is_verified_creator: roleAtLeast(role, "moderator"),
    created_at: now,
    updated_at: now,
    public_workflow_count: 0,
    public_plugin_count: 0,
    total_likes: 0,
    follower_count: 0,
  };

  return {
    id: "demo-user",
    email: "you@demo.leda",
    role,
    profile,
    is_demo: true,
  };
}

/** Reads the demo role cookie and returns a synthetic session, or null. */
function getDemoSessionUser(): SessionUser | null {
  const raw = cookies().get(DEMO_ROLE_COOKIE)?.value;
  if (!isUserRole(raw)) {
    // Absent, "guest", or any unknown value → not signed in.
    return null;
  }
  return buildDemoUser(raw);
}

// ---------------------------------------------------------------------------
// Supabase session
// ---------------------------------------------------------------------------

/** Loads the authenticated user + profile from Supabase, or null. */
async function getSupabaseSessionUser(): Promise<SessionUser | null> {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role,
    profile,
    is_demo: false,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves the current session user, or null when not signed in. Uses the demo
 * cookie when Supabase is not configured, otherwise the real auth user.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) {
    return getDemoSessionUser();
  }
  return getSupabaseSessionUser();
}

/**
 * Returns the current user, or null if unauthenticated. Caller handles the
 * redirect/403 — this never throws.
 */
export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Returns the current user when their role is at least `min`, else null. Caller
 * handles the redirect/403 — this never throws.
 */
export async function requireRole(min: UserRole): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !roleAtLeast(user.role, min)) {
    return null;
  }
  return user;
}
