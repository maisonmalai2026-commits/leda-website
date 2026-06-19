import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  paymentsEnabled,
  isDemoMode,
  isSupabaseConfigured,
} from "@/lib/marketplace/config";

// NOTE: config.ts reads SUPABASE_URL / SUPABASE_ANON_KEY into module-level
// consts at import time, but isSupabaseConfigured()/isDemoMode() are evaluated
// against those captured values. In the test (Vitest "node") environment the
// public Supabase env vars are absent, so the module captures empty strings and
// the marketplace correctly resolves to demo mode. paymentsEnabled() reads
// process.env live on each call, so we toggle it directly.

describe("paymentsEnabled", () => {
  const original = process.env.MARKETPLACE_PAYMENTS_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.MARKETPLACE_PAYMENTS_ENABLED;
    } else {
      process.env.MARKETPLACE_PAYMENTS_ENABLED = original;
    }
  });

  it("is true only when the flag is exactly 'true'", () => {
    process.env.MARKETPLACE_PAYMENTS_ENABLED = "true";
    expect(paymentsEnabled()).toBe(true);
  });

  it("is false when the flag is unset", () => {
    delete process.env.MARKETPLACE_PAYMENTS_ENABLED;
    expect(paymentsEnabled()).toBe(false);
  });

  it("is false for any non-'true' value", () => {
    process.env.MARKETPLACE_PAYMENTS_ENABLED = "false";
    expect(paymentsEnabled()).toBe(false);
    process.env.MARKETPLACE_PAYMENTS_ENABLED = "1";
    expect(paymentsEnabled()).toBe(false);
    process.env.MARKETPLACE_PAYMENTS_ENABLED = "TRUE";
    expect(paymentsEnabled()).toBe(false);
  });
});

describe("demo mode (no Supabase env)", () => {
  it("treats the marketplace as demo mode when Supabase env is absent", () => {
    // In this test environment the public Supabase vars are not set, so the
    // config module captured empty strings and reports "not configured".
    expect(isSupabaseConfigured()).toBe(false);
    expect(isDemoMode()).toBe(true);
  });

  it("isDemoMode is always the inverse of isSupabaseConfigured", () => {
    expect(isDemoMode()).toBe(!isSupabaseConfigured());
  });
});

describe("dynamic env reload for Supabase configuration", () => {
  // Demonstrates that with the public env vars set, a freshly-imported config
  // module reports "configured". We use vitest's module reset + dynamic import
  // so the module-level consts are recaptured against the mutated env.
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://demo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;

    vi.resetModules();
  });

  it("reports configured / not-demo when both public values are present", async () => {
    vi.resetModules();
    const fresh = await import("@/lib/marketplace/config");
    expect(fresh.isSupabaseConfigured()).toBe(true);
    expect(fresh.isDemoMode()).toBe(false);
  });
});
