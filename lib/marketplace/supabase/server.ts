import "server-only";

// ============================================================================
// Server Supabase clients.
//
// Two distinct clients live here:
//   1. getServerSupabase() — request-scoped, anon-key client wired to Next's
//      cookie store so it carries the signed-in user's session and is subject
//      to Row Level Security (RLS). Use this for normal authenticated reads.
//   2. getServiceClient()  — service-role client that BYPASSES RLS. It must
//      ONLY be used in trusted server code (webhooks, admin/moderation tasks,
//      seeding). Never expose it to the client or use it to serve user input
//      without explicit authorization checks.
//
// Both return null when the relevant env is absent so the marketplace keeps
// running in demo mode without crashing.
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/marketplace/config";

/**
 * Request-scoped server client bound to Next's cookie store. Reads/writes the
 * auth session cookies so RLS sees the current user. Returns null in demo mode.
 *
 * Note: cookie set/remove may throw when called from a React Server Component
 * (cookies are read-only there); we swallow those so reads still work. Mutating
 * the session should happen from Server Actions or Route Handlers.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — cookies are read-only here.
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Called from a Server Component — cookies are read-only here.
        }
      },
    },
  });
}

/**
 * Service-role client. WARNING: this client BYPASSES Row Level Security. It is
 * keyed by SUPABASE_SERVICE_ROLE_KEY (a server-only secret) and must ONLY be
 * used in trusted server code where access has already been authorized — e.g.
 * Stripe webhooks, admin/moderation actions, and seeding scripts. Never call it
 * with unsanitized user-controlled identifiers, and never import this from a
 * client component.
 *
 * Returns null when the URL or service-role key is absent (demo mode).
 */
export function getServiceClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (SUPABASE_URL.length === 0 || serviceRoleKey.length === 0) {
    return null;
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
