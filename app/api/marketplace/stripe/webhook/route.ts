// ============================================================================
// Stripe webhook endpoint (gated).
//
// Hard-gated: when payments are disabled this returns 503 immediately and does
// NOTHING else — no body read, no signature work, no order/entitlement writes.
// When enabled it verifies the Stripe signature against STRIPE_WEBHOOK_SECRET (a
// server-only secret) BEFORE trusting any event, then dispatches on event type.
// All real fulfillment is left as TODO so this compiles and is inert in demo.
//
// runtime "nodejs": we need the raw request body + Node crypto for signature
// verification (the Edge runtime cannot verify Stripe signatures the same way).
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { paymentsEnabled } from "@/lib/marketplace/config";
import { logAudit } from "@/lib/marketplace/audit";
import { getStripe } from "@/lib/marketplace/stripe/server";

export const runtime = "nodejs";
/** Never cache or pre-render a webhook receiver. */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // (1) Hard gate: payments off -> 503, no further work.
  if (!paymentsEnabled()) {
    return NextResponse.json(
      { ok: false, message: "Payments disabled" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  // (2) Misconfiguration guard: enabled but not fully wired.
  if (!stripe || webhookSecret.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Stripe is not fully configured." },
      { status: 503 },
    );
  }

  // (3) Read the RAW body + signature header for verification. Do NOT parse the
  // JSON before verifying — the signature is computed over the raw payload.
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, message: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  // (4) Verify the signature. Any failure here means the request is untrusted.
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed.";
    return NextResponse.json(
      { ok: false, message: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  // (5) Dispatch — only AFTER the signature is verified. All fulfillment is
  // left as TODO so no real state changes happen in this scaffold.
  switch (event.type) {
    case "checkout.session.completed":
      // TODO(payments): mark the matching order as paid and create the buyer's
      // entitlement row. Use the service-role client in trusted server code.
      break;
    case "payment_intent.succeeded":
      // TODO(payments): reconcile/confirm the order tied to this payment intent.
      break;
    case "payment_intent.payment_failed":
      // TODO(payments): mark the order as failed and notify the buyer.
      break;
    case "charge.refunded":
      // TODO(payments): mark the order refunded and revoke the entitlement.
      break;
    case "account.updated":
      // TODO(payments): sync the connected account's payouts_enabled / onboarding
      // status onto creator_payout_profiles.
      break;
    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  // Best-effort audit trail of the verified event (never blocks the 200).
  await logAudit({
    actor: "stripe",
    action: `webhook.${event.type}`,
    metadata: { eventId: event.id },
  });

  // (6) Acknowledge receipt so Stripe does not retry.
  return NextResponse.json({ ok: true, received: true });
}
