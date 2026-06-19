# Leda Marketplace — API & Server Actions Reference

> Planned marketplace mutation surface. Most mutations are implemented as
> **Next.js Server Actions** (not REST routes); a few need **Route Handlers**
> (auth callback, Stripe webhook). Reads are performed in Server Components via
> the data provider and are not documented as endpoints here.

## Conventions

- **Envelope.** Every mutation returns `ActionResult<T>`:
  ```ts
  interface ActionResult<T = undefined> {
    ok: boolean;
    demo?: boolean;        // true when run in local demo mode (not persisted)
    message?: string;
    error?: string;        // present when ok === false
    data?: T;
    issues?: ValidationIssue[]; // validation errors, when applicable
  }
  ```
- **Demo mode** (`isDemoMode()` — no Supabase env): mutations still **validate**
  input and enforce auth gating, then return `{ ok: true, demo: true }` without
  persisting. Reads serve labeled seed data. No network calls are made.
- **Auth/role** is resolved server-side into a `SessionUser` (`role`, `profile`,
  `is_demo`). The demo cookie session is **not** a security boundary; it only
  drives UI gating in demo mode.
- **Roles** referenced below come from `Role` = `guest | user | creator |
  moderator | admin`.
- **Rate limits** use `RATE_LIMITS` (submission/review/report) and are enforced
  server-side. Over-limit calls return `{ ok: false, error: "rate_limited" }`.
- **Errors.** On failure, `ok` is `false` with a stable `error` code, e.g.
  `unauthenticated`, `forbidden`, `not_found`, `validation_failed`,
  `rate_limited`, `payments_disabled`, `demo_unsupported`.

---

## Auth / demo

### `signInDemo` (Server Action)
- **Auth:** Guest.
- **Request:** `{ handle?: string }` (optional demo persona).
- **Response:** `ActionResult<{ session: SessionUser }>`.
- **Demo:** Sets a demo-session cookie and returns a `SessionUser` with
  `is_demo: true`. This is the **only** sign-in path when Supabase is absent.

### `signOut` (Server Action)
- **Auth:** User+.
- **Request:** none.
- **Response:** `ActionResult`.
- **Demo:** Clears the demo cookie; `{ ok: true, demo: true }`.

### `GET /auth/callback` (Route Handler — real auth only)
- **Auth:** Guest (OAuth/email magic-link return).
- **Behavior:** Exchanges the Supabase auth code for a session, then redirects.
- **Demo:** Not reachable in demo mode (no provider). Returns to the app.

### `getSession` (server helper, not a mutation)
- Resolves the current `SessionUser | null`. Demo returns the cookie persona.

---

## Engagement actions

### `copyWorkflow` (Server Action)
- **Path/name:** `copyWorkflow(workflowId: string)`
- **Auth:** **Guest+** (copying is allowed without an account).
- **Request:** `{ workflowId: string }`.
- **Response:** `ActionResult<{ workflow: WorkflowTemplate }>` (the sanitized
  copy as the caller's new `draft`).
- **Behavior:** Re-validates the source graph, **sanitizes** it (strips
  owner/private metadata, internal IDs; never copies secrets), increments
  `copied_count` on the source.
- **Demo:** Validates + sanitizes, returns `{ ok: true, demo: true, data }`
  without persisting.

### `toggleLike` (Server Action)
- **Auth:** **User+**.
- **Request:** `{ target_type: TargetType, target_id: string }`.
- **Response:** `ActionResult<{ liked: boolean; like_count: number }>`.
- **Behavior:** Idempotent toggle of a `MarketplaceLike` for `(user, target)`.
- **Demo:** `{ ok: true, demo: true, data: { liked, like_count } }` (in-memory).

### `toggleBookmark` (Server Action)
- **Auth:** **User+**.
- **Request:** `{ target_type: TargetType, target_id: string }`.
- **Response:** `ActionResult<{ bookmarked: boolean; bookmark_count: number }>`.
- **Behavior:** Toggles a `MarketplaceBookmark` for `(user, target)`.
- **Demo:** Returns toggled state, `demo: true`.

### `toggleFollow` (Server Action)
- **Auth:** **User+**.
- **Request:** `{ creator_id: string }`.
- **Response:** `ActionResult<{ following: boolean; follower_count: number }>`.
- **Behavior:** Toggles a `CreatorFollow`. Cannot follow self → `forbidden`.
- **Demo:** Returns toggled state, `demo: true`.

---

## Reviews

### `createReview` (Server Action)
- **Auth:** **User+**. One review per `(user, target)`.
- **Request:** `{ target_type: TargetType, target_id: string, rating: number /*1..5*/, body: string }`.
- **Response:** `ActionResult<{ review: MarketplaceReview }>`.
- **Behavior:** Validates `rating ∈ [1,5]` and body length; rate-limited by
  `RATE_LIMITS.review`. New review starts `moderation_status: "visible"` (or
  `"pending"` if flagged by anti-spam). Recomputes target `rating_avg`/`rating_count`.
- **Demo:** Validates, returns `{ ok: true, demo: true, data }`.

### `editReview` (Server Action)
- **Auth:** **User (author)** or Moderator+.
- **Request:** `{ review_id: string, rating?: number, body?: string }`.
- **Response:** `ActionResult<{ review: MarketplaceReview }>`.
- **Behavior:** Only the author may edit content; recomputes aggregates.
- **Demo:** Validates, `demo: true`.

### `deleteReview` (Server Action)
- **Auth:** **User (author)** or Moderator+.
- **Request:** `{ review_id: string }`.
- **Response:** `ActionResult`.
- **Behavior:** Author deletes own review; moderator can remove any.
- **Demo:** `{ ok: true, demo: true }`.

---

## Reporting

### `submitReport` (Server Action)
- **Auth:** **User+**.
- **Request:** `{ target_type: TargetType, target_id: string, reason: string, details?: string }`.
- **Response:** `ActionResult<{ report_id: string }>`.
- **Behavior:** Creates a `MarketplaceReport` with `status: "open"`;
  de-duplicated per `(reporter, target)`; rate-limited by `RATE_LIMITS.report`.
- **Demo:** Validates, returns `{ ok: true, demo: true }`.

---

## Submissions (Creator)

### `submitWorkflow` (Server Action)
- **Auth:** **Creator+** (`creator_status: "active"`, not suspended).
- **Request:** A `WorkflowTemplate` draft payload:
  `{ slug, title, short_description, long_description, category_id, tags,
     workflow_json: WorkflowGraph, required_plugins, declared_permissions,
     risk_level, skill_level, visibility, version }`.
- **Response:** `ActionResult<{ workflow: WorkflowTemplate }>` (status `pending`).
- **Behavior:** Runs the **workflow validator** (node allowlist, JSON-only config,
  sensitive-node confirmation/verification gating, no code/secrets/exe/paths).
  On `ok`, enters the moderation queue as `pending`. On failure, returns
  `{ ok: false, error: "validation_failed", issues }`. Rate-limited by
  `RATE_LIMITS.submission`. Material edits to an approved item reset to `pending`.
- **Demo:** Validates fully; returns `{ ok: true, demo: true, data }` without
  persisting. Validation errors are returned identically to real mode.

### `submitPlugin` (Server Action)
- **Auth:** **Creator+** (`creator_status: "active"`, not suspended).
- **Request:** A `PluginListing` draft payload:
  `{ slug, name, icon_url, short_description, long_description, category_id, tags,
     compatibility, required_apps, declared_permissions, cannot_access,
     installation_model, installation_instructions, source_url,
     documentation_url, support_url, screenshots, version, changelog }`.
- **Response:** `ActionResult<{ plugin: PluginListing }>` (status `pending`).
- **Behavior:** Runs the **plugin validator** (no code/secrets/exe; link sanity;
  `installation_model` allowlist — **no package upload**; trust tier cannot be
  self-claimed). On `ok`, enters the queue as `pending`. Rate-limited.
- **Demo:** Validates, returns `{ ok: true, demo: true, data }`.

---

## Moderation actions (Moderator / Admin)

All moderation actions require **Moderator+**, are performed by humans (no AI
auto-approval), and append a `ModerationAction` audit row. Generic shape:

### `moderateContent` (Server Action)
- **Auth:** **Moderator+**.
- **Request:**
  `{ target_type: "workflow" | "plugin", target_id: string,
     action: "approve" | "request_changes" | "reject" | "verify" | "deprecate" | "remove",
     reason?: string, trust_status?: TrustStatus /* plugins, on verify */ }`.
- **Response:** `ActionResult<{ moderation_status: ModerationStatus }>`.
- **Behavior:** Transitions `moderation_status` along the lifecycle
  (`pending → approved | changes_requested | rejected`,
  `approved → deprecated | removed`). `verify` may set a plugin `trust_status`
  (`official`/`verified`/…). Writes a `ModerationAction`.
- **Demo:** Returns the would-be status, `demo: true` (no persistence).

### `moderateReview` (Server Action)
- **Auth:** **Moderator+**.
- **Request:** `{ review_id: string, action: "hide" | "unhide" }`.
- **Response:** `ActionResult<{ moderation_status: "visible" | "hidden" }>`.
- **Behavior:** Toggles review visibility; logs a `ModerationAction`.
- **Demo:** `demo: true`.

### `resolveReport` (Server Action)
- **Auth:** **Moderator+**.
- **Request:** `{ report_id: string, resolution: "resolved" | "dismissed", reason?: string }`.
- **Response:** `ActionResult`.
- **Behavior:** Sets report `status` + `resolved_at` + `moderator_id`; logs a
  `ModerationAction`.
- **Demo:** `demo: true`.

### `setUserRole` / `setCreatorStatus` (Server Action — Admin)
- **Auth:** **Admin** (role changes); **Moderator+** may suspend creators.
- **Request:** `{ user_id: string, role?: UserRole, creator_status?: CreatorStatus }`.
- **Response:** `ActionResult<{ profile: Profile }>`.
- **Behavior:** Updates role/`creator_status`; logged. Admin-only for granting
  `moderator`/`admin`.
- **Demo:** `demo: true`.

---

## Payments (FUTURE — feature-flagged OFF)

Gated by `paymentsEnabled()` (`MARKETPLACE_PAYMENTS_ENABLED=true`) **and**
configured Stripe keys. While off, all of the below return
`{ ok: false, error: "payments_disabled" }` and paid UI renders "coming later".
Secret keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are read only in
`import "server-only"` modules.

### `createCheckoutSession` (Server Action — gated)
- **Auth:** **User+**.
- **Request:** `{ target_type: TargetType, target_id: string }`.
- **Response:** `ActionResult<{ url: string }>` (Stripe Checkout URL) when enabled.
- **Behavior:** Creates a `MarketplaceOrder` (`pending`), computes
  `platform_fee_amount` from `PLATFORM_FEE_BPS` (1000 = 10%), creates a Stripe
  Connect checkout session routed to the seller's connected account, returns the
  redirect URL.
- **Demo / disabled:** `{ ok: false, error: "payments_disabled" }`. Never
  initializes a Stripe client.

### `POST /api/marketplace/stripe/webhook` (Route Handler — gated)
- **Auth:** Stripe signature only (verified with `STRIPE_WEBHOOK_SECRET`).
- **Request:** Raw Stripe event body + `Stripe-Signature` header.
- **Response:** `200` on accepted event, `400` on bad signature.
- **Behavior:** On `checkout.session.completed` → set `MarketplaceOrder.status =
  "paid"` and grant a `MarketplaceEntitlement` (`purchased`). Handles
  `payment_failed → failed`. `refunded` / `disputed` are **placeholders** — no
  refund/chargeback flow is implemented.
- **Demo / disabled:** Endpoint is inert; signature verification fails closed and
  no Stripe client is constructed.

---

## Quick reference

| Action / route | Method | Min role | Returns | Demo behavior |
| --- | --- | --- | --- | --- |
| `signInDemo` | action | guest | `ActionResult<{session}>` | sets demo cookie |
| `signOut` | action | user | `ActionResult` | clears cookie |
| `GET /auth/callback` | route | guest | redirect | n/a (no provider) |
| `copyWorkflow` | action | guest | `ActionResult<{workflow}>` | validate+sanitize, `demo:true` |
| `toggleLike` | action | user | `ActionResult<{liked,like_count}>` | `demo:true` |
| `toggleBookmark` | action | user | `ActionResult<{bookmarked,…}>` | `demo:true` |
| `toggleFollow` | action | user | `ActionResult<{following,…}>` | `demo:true` |
| `createReview` | action | user | `ActionResult<{review}>` | validate, `demo:true` |
| `editReview` | action | author/mod | `ActionResult<{review}>` | `demo:true` |
| `deleteReview` | action | author/mod | `ActionResult` | `demo:true` |
| `submitReport` | action | user | `ActionResult<{report_id}>` | `demo:true` |
| `submitWorkflow` | action | creator | `ActionResult<{workflow}>` | validate, `demo:true` |
| `submitPlugin` | action | creator | `ActionResult<{plugin}>` | validate, `demo:true` |
| `moderateContent` | action | moderator | `ActionResult<{moderation_status}>` | `demo:true` |
| `moderateReview` | action | moderator | `ActionResult` | `demo:true` |
| `resolveReport` | action | moderator | `ActionResult` | `demo:true` |
| `setUserRole`/`setCreatorStatus` | action | admin/mod | `ActionResult<{profile}>` | `demo:true` |
| `createCheckoutSession` | action | user | `ActionResult<{url}>` | `payments_disabled` |
| `POST …/stripe/webhook` | route | Stripe sig | `200`/`400` | inert |
