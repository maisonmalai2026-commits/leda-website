"use server";

// ============================================================================
// Marketplace server actions.
//
// Every mutating interaction (copy, like, bookmark, follow, review, report,
// submit, moderate, checkout) funnels through here. Each action:
//   1. resolves the session via getSessionUser()
//   2. enforces the documented role/ownership rule
//   3. runs validation/rate-limit/audit where applicable
//   4. in DEMO mode does NOT persist — it returns { ok:true, demo:true, ... }
//
// Demo mode is the default with no env. Nothing here touches Stripe/Supabase
// secrets directly except through the gated server-only stubs, and no action
// fabricates metrics, reviews, or users.
//
// NOTE: this file is "use server" — it may only export async functions.
// ============================================================================

// import { revalidatePath } from "next/cache"; // (real impl) re-enable to bust caches

import { getSessionUser, roleAtLeast } from "@/lib/marketplace/auth";
import { isDemoMode, paymentsEnabled } from "@/lib/marketplace/config";
import {
  getPluginBySlug,
  getWorkflowBySlug,
} from "@/lib/marketplace/data";
import { logAudit } from "@/lib/marketplace/audit";
import { checkRateLimit } from "@/lib/marketplace/rate-limit";
import { validatePluginListing } from "@/lib/marketplace/validation/plugin";
import { validateWorkflowGraph } from "@/lib/marketplace/validation/workflow";
import {
  TARGET_TYPE,
  type ActionResult,
  type TargetType,
  type ValidationResult,
} from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Standard "you must sign in" envelope. */
function notSignedIn<T = undefined>(): ActionResult<T> {
  return {
    ok: false,
    error: "auth_required",
    message: "Sign in (demo) to do that.",
  };
}

/** Standard "insufficient role" envelope. */
function insufficientRole<T = undefined>(message: string): ActionResult<T> {
  return { ok: false, error: "forbidden", message };
}

/** Standard rate-limited envelope. */
function rateLimited<T = undefined>(retryAfterMs?: number): ActionResult<T> {
  const seconds = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 0;
  const suffix = seconds > 0 ? ` Try again in ${seconds}s.` : "";
  return {
    ok: false,
    error: "rate_limited",
    message: `You're doing that too fast.${suffix}`,
  };
}

/** Validate that a value is one of the known target types. */
function isTargetType(value: unknown): value is TargetType {
  return (
    typeof value === "string" && (TARGET_TYPE as readonly string[]).includes(value)
  );
}

/** Slugify a free-text title into a URL-safe slug (demo preview only). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
// Copy a workflow into the user's private workspace.
// ---------------------------------------------------------------------------

/**
 * Copy a public workflow template into the signed-in user's private Leda
 * workspace. Re-validates the workflow graph server-side and refuses if the
 * workflow is missing or invalid. Only the declarative graph is copied — never
 * owner/private fields.
 */
export async function copyWorkflow(
  slug: string,
): Promise<ActionResult<{ copiedId: string }>> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();

  const workflow = await getWorkflowBySlug(slug);
  if (!workflow) {
    return {
      ok: false,
      error: "not_found",
      message: "That workflow could not be found.",
    };
  }

  // SECURITY: never trust stored graphs blindly — re-validate before copying.
  const validation = validateWorkflowGraph(workflow.workflow_json);
  if (!validation.ok) {
    return {
      ok: false,
      error: "invalid_workflow",
      message: "This workflow failed safety validation and was not copied.",
      issues: validation.issues,
    };
  }

  // Copy ONLY the declarative graph — strip owner_id, visibility, metrics, etc.
  // (In a real impl this graph would be written to the user's private space.)
  const copiedGraph = {
    nodes: workflow.workflow_json.nodes,
    edges: workflow.workflow_json.edges,
  };
  void copiedGraph;

  const successMessage =
    "Copied to your private Leda workspace. Review before enabling.";

  if (isDemoMode()) {
    // Demo: do not persist. Return a synthetic id so the UI can react.
    return {
      ok: true,
      demo: true,
      message: successMessage,
      data: { copiedId: `demo-copy-${slug}` },
    };
  }

  // TODO(supabase): insert a private workflow_template row owned by user.id with
  // the validated graph, then revalidatePath("/marketplace/library").
  return {
    ok: true,
    message: successMessage,
    data: { copiedId: `copy-${slug}` },
  };
}

// ---------------------------------------------------------------------------
// Likes / bookmarks / follows (optimistic toggles).
// ---------------------------------------------------------------------------

/** Toggle a like on a workflow/plugin/profile. */
export async function toggleLike(
  targetType: TargetType,
  targetId: string,
): Promise<ActionResult<{ liked: boolean }>> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!isTargetType(targetType) || !targetId) {
    return { ok: false, error: "bad_request", message: "Invalid like target." };
  }

  if (isDemoMode()) {
    // Demo has no persistence — report the optimistic "liked" state as true.
    return { ok: true, demo: true, message: "Liked (demo).", data: { liked: true } };
  }

  // TODO(supabase): upsert/delete a marketplace_likes row for (user, target),
  // then revalidatePath of the affected detail page.
  return { ok: true, data: { liked: true } };
}

/** Toggle a bookmark on a workflow/plugin/profile. */
export async function toggleBookmark(
  targetType: TargetType,
  targetId: string,
): Promise<ActionResult<{ bookmarked: boolean }>> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!isTargetType(targetType) || !targetId) {
    return { ok: false, error: "bad_request", message: "Invalid bookmark target." };
  }

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message: "Bookmarked (demo).",
      data: { bookmarked: true },
    };
  }

  // TODO(supabase): upsert/delete a marketplace_bookmarks row, then revalidate.
  return { ok: true, data: { bookmarked: true } };
}

/** Toggle following a creator. */
export async function toggleFollow(
  creatorId: string,
): Promise<ActionResult<{ following: boolean }>> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!creatorId) {
    return { ok: false, error: "bad_request", message: "Invalid creator." };
  }
  if (creatorId === user.id) {
    return {
      ok: false,
      error: "self_follow",
      message: "You cannot follow yourself.",
    };
  }

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message: "Following (demo).",
      data: { following: true },
    };
  }

  // TODO(supabase): upsert/delete a creator_follows row, then revalidate.
  return { ok: true, data: { following: true } };
}

// ---------------------------------------------------------------------------
// Reviews.
// ---------------------------------------------------------------------------

export interface SubmitReviewInput {
  targetType: TargetType;
  targetId: string;
  rating: number;
  body: string;
}

/**
 * Submit a review for a workflow or plugin. Requires sign-in, rejects reviewing
 * your own content, rate-limited. Demo mode does not persist.
 */
export async function submitReview(
  input: SubmitReviewInput,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();

  const { targetType, targetId, rating, body } = input ?? {};
  if (!isTargetType(targetType) || !targetId) {
    return { ok: false, error: "bad_request", message: "Invalid review target." };
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return {
      ok: false,
      error: "bad_request",
      message: "Rating must be between 1 and 5.",
    };
  }
  if (typeof body !== "string" || body.trim().length === 0) {
    return {
      ok: false,
      error: "bad_request",
      message: "Please write a short review.",
    };
  }

  // Rate-limit per user.
  const limit = checkRateLimit(user.id, "review");
  if (!limit.allowed) return rateLimited(limit.retryAfterMs);

  // SECURITY: you may not review your own content. Resolve the target's owner.
  const ownerId = await resolveTargetOwnerId(targetType, targetId);
  if (ownerId && ownerId === user.id) {
    return {
      ok: false,
      error: "self_review",
      message: "You cannot review your own content.",
    };
  }

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message: "Thanks! Your review was recorded (demo).",
    };
  }

  // TODO(supabase): insert a reviews row (moderation_status default per policy),
  // then revalidate the target's detail page.
  return { ok: true, message: "Thanks! Your review was submitted." };
}

/** Delete a review. Owner-or-moderator in a real impl; demo is inert. */
export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!reviewId) {
    return { ok: false, error: "bad_request", message: "Invalid review id." };
  }

  if (isDemoMode()) {
    return { ok: true, demo: true, message: "Review removed (demo)." };
  }

  // TODO(supabase): delete the review when user is the author OR a moderator,
  // enforced by RLS + an explicit check, then revalidate.
  return { ok: true, message: "Review removed." };
}

// ---------------------------------------------------------------------------
// Reports.
// ---------------------------------------------------------------------------

export interface SubmitReportInput {
  targetType: TargetType;
  targetId: string;
  reason: string;
  details?: string;
}

/**
 * Report a workflow/plugin/profile for review. Requires sign-in, rate-limited.
 * Demo mode does not persist (the report is acknowledged honestly).
 */
export async function submitReport(
  input: SubmitReportInput,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();

  const { targetType, targetId, reason, details } = input ?? {};
  if (!isTargetType(targetType) || !targetId) {
    return { ok: false, error: "bad_request", message: "Invalid report target." };
  }
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return {
      ok: false,
      error: "bad_request",
      message: "Please choose a reason for the report.",
    };
  }

  const limit = checkRateLimit(user.id, "report");
  if (!limit.allowed) return rateLimited(limit.retryAfterMs);

  void details;

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message: "Thanks for the report. Our team will review it (demo).",
    };
  }

  // TODO(supabase): insert a marketplace_reports row (status "open") and notify
  // moderators. No revalidate needed (reports are not publicly visible).
  return {
    ok: true,
    message: "Thanks for the report. Our team will review it.",
  };
}

// ---------------------------------------------------------------------------
// Creator submissions (workflow draft + plugin listing).
// ---------------------------------------------------------------------------

export interface SubmitWorkflowDraftInput {
  title?: string;
  short_description?: string;
  long_description?: string;
  workflow_json?: unknown;
  [key: string]: unknown;
}

/**
 * Submit a workflow draft. Requires the creator role. Runs the workflow-graph
 * validator and returns the full ValidationResult so the UI can render issues
 * inline. High-risk graphs that fail the confirmation/verification rule surface
 * those issues via validation (ok:false). Demo mode does not persist.
 */
export async function submitWorkflowDraft(
  input: SubmitWorkflowDraftInput,
): Promise<ActionResult<{ validation: ValidationResult; slug?: string }>> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!roleAtLeast(user.role, "creator")) {
    return insufficientRole(
      "You need a creator account to submit a workflow.",
    );
  }

  const limit = checkRateLimit(user.id, "submission");
  if (!limit.allowed) return rateLimited(limit.retryAfterMs);

  // Validate the declarative graph. validateWorkflowGraph accepts a string or
  // a parsed object and enforces every safety invariant (allow-listed nodes,
  // trigger/end presence, no cycles, sensitive actions require ask_confirmation
  // + verify_result, no forbidden content).
  const validation = validateWorkflowGraph(input?.workflow_json);
  const slug =
    typeof input?.title === "string" && input.title.trim().length > 0
      ? slugify(input.title)
      : undefined;

  if (!validation.ok) {
    // Invalid — return ok:false plus issues so the form can render them.
    return {
      ok: false,
      error: "validation_failed",
      message: "Please fix the issues below before submitting.",
      issues: validation.issues,
      data: { validation, slug },
    };
  }

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message:
        "Draft validated. In demo mode it is not saved — connect a backend to submit for review.",
      data: { validation, slug },
    };
  }

  // TODO(supabase): insert a workflow_template row (moderation_status "pending")
  // owned by user.id with the validated graph, then revalidate the creator's
  // dashboard. Human review approves it before it becomes public.
  return {
    ok: true,
    message: "Draft submitted for review.",
    data: { validation, slug },
  };
}

export interface SubmitPluginListingInput {
  name?: string;
  short_description?: string;
  long_description?: string;
  category_id?: string;
  version?: string;
  /** Mandatory safety/ownership confirmation checkbox. */
  confirmed?: boolean;
  [key: string]: unknown;
}

/**
 * Submit a plugin listing. Requires the creator role and an explicit
 * `confirmed === true` safety/ownership checkbox (enforced by the validator).
 * Demo mode does not persist.
 */
export async function submitPluginListing(
  input: SubmitPluginListingInput,
): Promise<ActionResult<{ validation: ValidationResult }>> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!roleAtLeast(user.role, "creator")) {
    return insufficientRole(
      "You need a creator account to submit a plugin listing.",
    );
  }

  const limit = checkRateLimit(user.id, "submission");
  if (!limit.allowed) return rateLimited(limit.retryAfterMs);

  const validation = validatePluginListing(input, {
    confirmed: input?.confirmed,
  });

  if (!validation.ok) {
    return {
      ok: false,
      error: "validation_failed",
      message: "Please fix the issues below before submitting.",
      issues: validation.issues,
      data: { validation },
    };
  }

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message:
        "Listing validated. In demo mode it is not saved — connect a backend to submit for review.",
      data: { validation },
    };
  }

  // TODO(supabase): insert a plugin_listings row (trust_status "community",
  // moderation_status "pending"), then revalidate the creator's dashboard.
  return {
    ok: true,
    message: "Listing submitted for review.",
    data: { validation },
  };
}

// ---------------------------------------------------------------------------
// Moderation.
// ---------------------------------------------------------------------------

export interface ModerateContentInput {
  targetType: TargetType;
  targetId: string;
  action: string;
  reason?: string;
}

/**
 * Apply a moderation action to a target. Requires the moderator role (or above)
 * and records an audit entry. Demo mode does not persist the status change but
 * still writes the audit line so the action is traceable locally.
 */
export async function moderateContent(
  input: ModerateContentInput,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return notSignedIn();
  if (!roleAtLeast(user.role, "moderator")) {
    return insufficientRole("Moderator access is required for this action.");
  }

  const { targetType, targetId, action, reason } = input ?? {};
  if (!isTargetType(targetType) || !targetId || !action) {
    return {
      ok: false,
      error: "bad_request",
      message: "Invalid moderation request.",
    };
  }

  // Always record the moderation action in the audit log.
  await logAudit({
    actor: user.id,
    action: `moderate.${action}`,
    targetType,
    targetId,
    metadata: { reason: reason ?? null, demo: isDemoMode() },
  });

  if (isDemoMode()) {
    return {
      ok: true,
      demo: true,
      message: `Recorded moderation action "${action}" (demo, not persisted).`,
    };
  }

  // TODO(supabase): update the target's moderation_status, insert a
  // moderation_actions row via the service-role client, then revalidate the
  // moderation queue + the affected detail page.
  return {
    ok: true,
    message: `Applied moderation action "${action}".`,
  };
}

// ---------------------------------------------------------------------------
// Checkout (gated behind payments flag).
// ---------------------------------------------------------------------------

export interface CreateCheckoutInput {
  targetType: TargetType;
  targetId: string;
}

/**
 * Create a Stripe Checkout session for a paid listing. HARD-GATED: when payments
 * are disabled this returns a "coming later" message and never touches Stripe.
 */
export async function createCheckoutSession(
  input: CreateCheckoutInput,
): Promise<ActionResult<{ url?: string }>> {
  // Gate FIRST — no session/Stripe work while payments are disabled.
  if (!paymentsEnabled()) {
    return { ok: false, message: "Premium marketplace coming later" };
  }

  const user = await getSessionUser();
  if (!user) return notSignedIn();

  const { targetType, targetId } = input ?? {};
  if (!isTargetType(targetType) || !targetId) {
    return { ok: false, error: "bad_request", message: "Invalid checkout target." };
  }

  // TODO(payments): resolve the listing + seller, then call
  // createCheckout(...) from lib/marketplace/stripe/server and return its url.
  // Record a pending order + audit the checkout creation.
  await logAudit({
    actor: user.id,
    action: "payment.checkout_requested",
    targetType,
    targetId,
  });

  return {
    ok: false,
    error: "not_implemented",
    message: "Checkout is not available yet.",
    data: { url: undefined },
  };
}

// ---------------------------------------------------------------------------
// Internal: resolve a target's owner id for ownership checks (demo via data).
// ---------------------------------------------------------------------------

/**
 * Look up the owner id of a review/report/like target. Returns null for the
 * "profile" target type (a profile's "owner" is itself, handled by the caller)
 * or when the target cannot be found.
 */
async function resolveTargetOwnerId(
  targetType: TargetType,
  targetId: string,
): Promise<string | null> {
  if (targetType === "workflow") {
    const wf = await getWorkflowBySlug(targetId);
    return wf?.owner_id ?? null;
  }
  if (targetType === "plugin") {
    const pl = await getPluginBySlug(targetId);
    return pl?.owner_id ?? null;
  }
  // For "profile", the target IS the owner; treat it as the owner id.
  return targetType === "profile" ? targetId : null;
}
