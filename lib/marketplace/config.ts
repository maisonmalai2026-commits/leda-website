// ============================================================================
// Marketplace runtime configuration.
//
// Client-safe: this module only reads NEXT_PUBLIC_* values and a couple of
// non-public flags. It NEVER reads or exposes SUPABASE_SERVICE_ROLE_KEY,
// STRIPE_SECRET_KEY, or STRIPE_WEBHOOK_SECRET. Those live only in server-only
// modules (lib/marketplace/supabase/server.ts, lib/marketplace/stripe/*).
// ============================================================================

/** Public Supabase URL (safe to expose). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Public Supabase anon key (safe to expose — protected by RLS). */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Public Stripe publishable key (safe to expose). */
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Supabase is "configured" only when both public values are present. When it is
 * not configured the whole marketplace runs in local demo mode against seed
 * data — no network calls, no auth backend required.
 */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

/** Convenience inverse used throughout the data + auth layers. */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

/**
 * Real checkout is hard-gated behind MARKETPLACE_PAYMENTS_ENABLED=true. While
 * false (the default), all content is free, no Stripe calls are made, and paid
 * UI renders as "coming later". This is read server-side; client components
 * should receive the resolved boolean as a prop.
 */
export function paymentsEnabled(): boolean {
  return process.env.MARKETPLACE_PAYMENTS_ENABLED === "true";
}

/** Marketplace-wide feature flags, resolved once for passing to the client. */
export interface MarketplaceFlags {
  demoMode: boolean;
  paymentsEnabled: boolean;
}

export function getMarketplaceFlags(): MarketplaceFlags {
  return {
    demoMode: isDemoMode(),
    paymentsEnabled: paymentsEnabled(),
  };
}

/** Default platform fee (basis points) shown to creators before publishing. */
export const PLATFORM_FEE_BPS = 1000; // 10%

/** Simple in-memory rate-limit budgets (placeholder; real limits server-side). */
export const RATE_LIMITS = {
  submission: { windowMs: 60_000, max: 3 },
  review: { windowMs: 60_000, max: 5 },
  report: { windowMs: 60_000, max: 5 },
} as const;
