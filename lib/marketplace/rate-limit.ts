// ============================================================================
// In-memory rate-limit placeholder.
//
// This is a best-effort, single-process token-bucket used to discourage rapid
// repeated submissions/reviews/reports during local demo exploration. It uses a
// module-level Map keyed by `${kind}:${key}` and the windows/budgets declared in
// RATE_LIMITS (lib/marketplace/config).
//
// PRODUCTION NOTE: this is NOT a real rate limiter. A module-level Map is
// per-instance, resets on cold start, and does not coordinate across serverless
// invocations or regions. A durable, shared store (Redis / Upstash / a Postgres
// table with a sliding window) is required before relying on this for abuse
// prevention. Treat the result here as advisory only.
// ============================================================================

import { RATE_LIMITS } from "@/lib/marketplace/config";

export type RateLimitKind = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the caller may retry, present only when blocked. */
  retryAfterMs?: number;
}

/** A single bucket's state: timestamps (ms) of hits inside the current window. */
interface Bucket {
  hits: number[];
}

/**
 * Module-level store. Intentionally not exported. Lives only for the lifetime of
 * the process/instance — see the PRODUCTION NOTE above.
 */
const buckets = new Map<string, Bucket>();

/**
 * Check (and record) a rate-limited action. Returns { allowed } and, when
 * blocked, the retryAfterMs until the oldest hit in the window expires.
 *
 * The check is recorded as a hit only when allowed, so a blocked caller does not
 * keep extending its own window.
 */
export function checkRateLimit(
  key: string,
  kind: RateLimitKind,
): RateLimitResult {
  const limit = RATE_LIMITS[kind];
  if (!limit) {
    // Unknown kind — fail open (never block on a misconfiguration).
    return { allowed: true };
  }

  const now = Date.now();
  const windowStart = now - limit.windowMs;
  const bucketKey = `${kind}:${key}`;

  const bucket = buckets.get(bucketKey) ?? { hits: [] };
  // Drop hits that have aged out of the window.
  const recent = bucket.hits.filter((t) => t > windowStart);

  if (recent.length >= limit.max) {
    const oldest = recent[0];
    const retryAfterMs = Math.max(0, oldest + limit.windowMs - now);
    // Persist the pruned window so it does not grow unbounded.
    buckets.set(bucketKey, { hits: recent });
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  buckets.set(bucketKey, { hits: recent });
  return { allowed: true };
}

/** Test/dev helper: clear all in-memory buckets. Safe to call anytime. */
export function resetRateLimits(): void {
  buckets.clear();
}
