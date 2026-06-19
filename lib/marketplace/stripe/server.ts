import "server-only";

// ============================================================================
// Stripe server client + gated payment stubs (server-only).
//
// Real payments are HARD-GATED behind paymentsEnabled() (MARKETPLACE_PAYMENTS_
// ENABLED=true) AND a present STRIPE_SECRET_KEY. While payments are disabled
// (the default), getStripe() returns null and the helper stubs refuse to do any
// real work — no network calls, no account links, no checkout sessions. This
// keeps the marketplace fully functional in demo mode with zero env.
//
// NEVER import this module from a client component: it reads STRIPE_SECRET_KEY,
// a server-only secret.
// ============================================================================

import Stripe from "stripe";

import { PLATFORM_FEE_BPS, paymentsEnabled } from "@/lib/marketplace/config";

/** Lazily-constructed singleton so we don't recreate the client per call. */
let cached: Stripe | null = null;

/**
 * Returns a configured Stripe client, or null when payments are disabled or the
 * secret key is absent. Callers MUST handle null (treat it as "payments off").
 */
export function getStripe(): Stripe | null {
  if (!paymentsEnabled()) {
    return null;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (secretKey.length === 0) {
    return null;
  }

  if (cached) {
    return cached;
  }

  // apiVersion intentionally omitted so the installed SDK's pinned version is
  // used; set it explicitly here when we adopt a specific Stripe API version.
  cached = new Stripe(secretKey, {
    typescript: true,
  });
  return cached;
}

export interface ConnectAccountLinkParams {
  /** The platform's local account/owner id requesting onboarding. */
  ownerId: string;
  /** Existing Stripe Connect account id, when one already exists. */
  stripeAccountId?: string | null;
  /** Where Stripe should send the user on completion / refresh. */
  returnUrl: string;
  refreshUrl: string;
}

/**
 * Gated stub: create (or refresh) a Stripe Connect onboarding link for a
 * creator. Returns null when payments are disabled or Stripe is not configured.
 *
 * TODO(payments): when enabled, create the Express/Standard account if needed
 * (stripe.accounts.create), then stripe.accountLinks.create(...) and return the
 * hosted onboarding URL. Persist the resulting account id to
 * creator_payout_profiles.
 */
export async function createConnectAccountLink(
  params: ConnectAccountLinkParams,
): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    // Payments disabled — no-op. Caller surfaces a "coming later" message.
    return null;
  }

  // Reference params so the stub keeps its real signature without unused-var
  // lint noise. No real Stripe calls run until the TODO above is implemented.
  void params;
  return null;
}

export interface CheckoutParams {
  /** Buyer (local user id). */
  buyerId: string;
  /** Seller / content owner (local profile id). */
  sellerId: string;
  targetType: "workflow" | "plugin";
  targetId: string;
  /** Charge amount in the smallest currency unit (e.g. cents). */
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Gated stub: create a Stripe Checkout Session for a paid listing. Returns null
 * when payments are disabled or Stripe is not configured.
 *
 * TODO(payments): when enabled, compute the platform fee from PLATFORM_FEE_BPS,
 * create a Checkout Session in destination-charge mode (payment_intent_data.
 * application_fee_amount + transfer_data.destination = seller's connected
 * account), record a pending order, and return session.url.
 */
export async function createCheckout(
  params: CheckoutParams,
): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) {
    return null;
  }

  // Platform fee preview (kept here so the calculation lives next to checkout).
  const applicationFeeAmount = Math.round(
    (params.amount * PLATFORM_FEE_BPS) / 10_000,
  );
  void applicationFeeAmount;
  void params;
  return null;
}
