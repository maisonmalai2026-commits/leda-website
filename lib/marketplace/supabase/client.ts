// ============================================================================
// Browser Supabase client factory.
//
// Client-safe: imports only NEXT_PUBLIC_* values via @/lib/marketplace/config.
// Returns null in demo mode (no env configured) so callers can branch cleanly
// instead of crashing. Safe to import from client components.
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";

import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/marketplace/config";

/** A configured browser Supabase client, or null in demo mode. */
export type BrowserSupabase = ReturnType<typeof createBrowserClient>;

/**
 * Returns a browser Supabase client when the public env is configured, else
 * null. Never throws — callers should treat null as "demo mode / no backend".
 */
export function getBrowserSupabase(): BrowserSupabase | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
