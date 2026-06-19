# Leda Marketplace — Architecture Plan (Phase 2)

> Status: **Phase 2 build, demo-mode-first.** This document describes the
> architecture, data model, roles, review process, content types, security
> summary, payment plan, and phased rollout for the Leda Marketplace.
>
> **Honesty note.** The marketplace ships with clearly-labeled **Demo** seed
> content only. There are **no** real users, reviews, ratings, download counts,
> revenue, testimonials, or partnerships represented as real. Every seed record
> carries `is_demo: true` and is rendered with a visible "Demo" label. No metric
> on any page is a real-world claim until real data exists.

---

## 1. Goals and non-goals

**Goals (Phase 2)**

- A browsable gallery of **free workflow templates** and **reviewed plugin
  listings** that works with **zero backend configured** (demo mode).
- A data model and validation layer that makes it structurally impossible to
  publish arbitrary code, executables, or secret-harvesting content.
- A **human** moderation pipeline (no AI auto-approval) with audit logging.
- Forward-compatible scaffolding for accounts, social features, and (later,
  legally-gated) paid sales via Stripe Connect.

**Non-goals (Phase 2)**

- Running, executing, or installing anything. The marketplace stores and
  displays **declarative metadata**; it does not execute workflows or plugins.
- Real payments, payouts, refunds, or disputes (scaffolded, hard-flagged off).
- Distributing installable/signed plugin packages (future installation model).

---

## 2. Architecture overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js 14 App Router (TypeScript + Tailwind)                     │
│                                                                    │
│  Server Components ─ read marketplace data via a provider          │
│  Server Actions   ─ mutations return ActionResult<T>               │
│  Route Handlers   ─ Stripe webhook (future), auth/demo helpers     │
│  Client Components ─ receive resolved flags as props               │
└───────────────┬───────────────────────────────┬──────────────────┘
                │                                 │
   ┌────────────▼────────────┐      ┌─────────────▼──────────────────┐
   │  DEMO PROVIDER          │      │  SUPABASE PROVIDER              │
   │  (default, no env)      │      │  (when isSupabaseConfigured())  │
   │  • reads seed JSON      │      │  • Postgres + RLS               │
   │  • cookie "demo sign-in"│      │  • Auth (email/OAuth)           │
   │  • mutations are no-ops │      │  • Storage (icons/screenshots)  │
   │    → {ok:true,demo:true}│      │  • service role in server-only  │
   └─────────────────────────┘      └──────────────┬─────────────────┘
                                                    │
                                       ┌────────────▼─────────────┐
                                       │  STRIPE CONNECT (Phase 3)│
                                       │  feature-flagged OFF     │
                                       │  secret keys server-only │
                                       └──────────────────────────┘
```

### Demo-mode-first principle

Configuration is resolved in `@/lib/marketplace/config`:

- `isSupabaseConfigured()` is `true` only when **both** `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present.
- `isDemoMode()` is its inverse. When demo mode is on:
  - **Reads** come from local seed JSON. No network calls are made.
  - **Auth** is a cookie-based "demo sign-in" (no real credentials).
  - **Mutations** validate input, then return `ActionResult { ok: true, demo: true }`
    without persisting anything.
- `paymentsEnabled()` is `true` only when `MARKETPLACE_PAYMENTS_ENABLED === "true"`.
  It is read **server-side**; client components receive the resolved boolean as a
  prop via `getMarketplaceFlags()`.

Every Supabase/Stripe client is **lazily initialized** and guarded behind these
checks, so the app must never crash when env is absent.

### Module boundaries

| Concern | Location | Client-safe? |
| --- | --- | --- |
| Domain types + enum arrays | `lib/marketplace/types.ts` | Yes (types/consts only) |
| Runtime config + flags | `lib/marketplace/config.ts` | Yes (`NEXT_PUBLIC_*` only) |
| Supabase **server** client (service role) | `lib/marketplace/supabase/server.ts` | **No** — `import "server-only"` |
| Supabase browser client (anon key) | `lib/marketplace/supabase/client.ts` | Yes (anon key + RLS) |
| Stripe server client / webhook | `lib/marketplace/stripe/*` | **No** — `import "server-only"` |

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`) may **only** be read inside files whose first line is
`import "server-only";`. They are never imported into a client component and
never exposed to the browser.

---

## 3. Data model

The canonical shapes live in `lib/marketplace/types.ts` and mirror the SQL
tables under `/supabase/migrations`. Summary of the core tables/types:

| Table / type | Purpose | Key fields |
| --- | --- | --- |
| `Profile` | Public-facing user/creator profile | `handle`, `display_name`, `role`, `creator_status`, `is_verified_creator`, `profile_visibility`; derived counts (`public_workflow_count`, `follower_count`, …) |
| `MarketplaceCategory` | Browse taxonomy | `slug`, `type` (`workflow` \| `plugin` \| `both`), `sort_order`, `active` |
| `WorkflowTemplate` | A declarative, copyable workflow | `slug`, `workflow_json` (graph), `preview_graph_json`, `required_plugins`, `declared_permissions`, `risk_level`, `skill_level`, `visibility`, `moderation_status`, `pricing_model`, engagement counts |
| `WorkflowTemplateVersion` | Immutable version history | `version`, `workflow_json`, `changelog` |
| `WorkflowGraph` / `WorkflowNode` / `WorkflowEdge` | The declarative graph itself | nodes restricted to `WORKFLOW_NODE_TYPES`; node `config` is `JsonValue` only (no code) |
| `PluginListing` | Metadata-only plugin description | `slug`, `installation_model`, `declared_permissions`, `cannot_access`, `compatibility`, `required_apps`, `trust_status`, `moderation_status`, links (`source_url`, `documentation_url`, …) |
| `PluginListingVersion` | Listing version snapshots | `version`, `changelog`, `listing_snapshot` |
| `MarketplaceReview` | 1–5 rating + body | `target_type`, `target_id`, `rating`, `moderation_status` (`visible`\|`hidden`\|`pending`) |
| `MarketplaceLike` / `MarketplaceBookmark` | Engagement | polymorphic `target_type` + `target_id` |
| `CreatorFollow` | Social graph | `follower_id`, `creator_id` |
| `MarketplaceReport` | User-filed reports | `reason`, `details`, `status` (`open`\|`reviewing`\|`resolved`\|`dismissed`), `moderator_id` |
| `ModerationAction` | Audit log of moderator decisions | `moderator_id`, `action`, `reason`, `metadata` |
| `CreatorPayoutProfile` | **Future** payout onboarding | `stripe_account_id`, `onboarding_status`, `payouts_enabled` |
| `MarketplaceOrder` | **Future** purchase record | `amount`, `currency`, `platform_fee_amount`, `status` (`OrderStatus`) |
| `MarketplaceEntitlement` | What a user is allowed to use | `entitlement_type` (`free`\|`purchased`\|`admin_granted`) |
| `SessionUser` | Resolved auth session | `role`, `profile`, `is_demo` |

**Polymorphic targets.** Likes, bookmarks, reviews, and reports all use
`TARGET_TYPE = ["workflow", "plugin", "profile"]`.

**JSON-safety.** `WorkflowNode.config` is typed as `Record<string, JsonValue>`,
where `JsonValue` admits only JSON primitives/arrays/objects. Functions and code
are not representable — enforced again at runtime by the validator (see
`MARKETPLACE_SECURITY.md`).

---

## 4. User roles and capabilities

Roles are defined by `USER_ROLES = ["user", "creator", "moderator", "admin"]`,
plus the implicit `"guest"` (not signed in) used for UI gating (`Role` type).

| Capability | Guest | User | Creator | Moderator | Admin |
| --- | :---: | :---: | :---: | :---: | :---: |
| Browse public workflows/plugins/profiles | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Copy** a public workflow template (sanitized) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Like / bookmark / follow | — | ✓ | ✓ | ✓ | ✓ |
| Write / edit / delete own review | — | ✓ | ✓ | ✓ | ✓ |
| File a report | — | ✓ | ✓ | ✓ | ✓ |
| Own a public profile | — | ✓ | ✓ | ✓ | ✓ |
| **Submit** workflow templates / plugin listings for review | — | — | ✓ | ✓ | ✓ |
| Edit own submissions (resets to `pending` on material change) | — | — | ✓ | ✓ | ✓ |
| See moderation queue | — | — | — | ✓ | ✓ |
| Approve / reject / request-changes / verify / deprecate / remove content | — | — | — | ✓ | ✓ |
| Hide/unhide reviews, resolve reports | — | — | — | ✓ | ✓ |
| Manage roles, categories, trust tiers, feature flags | — | — | — | — | ✓ |
| Grant `admin_granted` entitlements | — | — | — | — | ✓ |

A `user` becomes a `creator` when `creator_status` transitions to `"active"`.
`creator_status` may be `"suspended"` by a moderator/admin, which blocks new
submissions while leaving existing approved content subject to normal lifecycle.

---

## 5. Human review process (no AI auto-approval)

**Every** submission is reviewed by a human moderator before it becomes public.
There is **no automated path to "approved".** AI may **assist** moderators (e.g.
flagging suspicious nodes, summarizing diffs, surfacing validator output) but
**never** approves, rejects, or publishes content on its own.

Lifecycle (`MODERATION_STATUS`):

```
draft ──submit──▶ pending ──▶ approved      (public, listed)
                     │   └────▶ changes_requested ──resubmit──▶ pending
                     └────────▶ rejected     (not public; appealable)
approved ──▶ deprecated   (kept visible, marked outdated)
approved ──▶ removed       (taken down for policy violation)
```

- Submission runs the **validator** first (structural/security checks). Validator
  failure blocks submission with `ValidationIssue[]`; it does not auto-reject —
  it prevents an invalid submission from ever entering the queue.
- A passing submission enters `pending`. A moderator then chooses one of:
  approve, request changes, reject, (for plugins) set trust tier / verify,
  deprecate, or remove.
- Material edits to an `approved` item reset it to `pending` for re-review.
- Every moderator decision writes a `ModerationAction` audit row.

Plugin trust tiers (`TRUST_STATUS`) — `official`, `verified`, `community`,
`experimental`, `rejected`, `deprecated`, `coming_soon` — are **assigned by
moderators**, never self-claimed.

---

## 6. The two content types (and the future third)

| | **Workflow Template** | **Plugin Listing** | **Signed Plugin Package** (future) |
| --- | --- | --- | --- |
| What it is | Declarative graph of nodes describing an automation | Metadata describing a plugin (no binary) | An actual installable, code-signed bundle |
| Stored payload | `workflow_json` (graph of `WORKFLOW_NODE_TYPES`) | Text/links/screenshots only | Signed artifact + manifest |
| Executable code? | **No** — declarative JSON only | **No** — no code stored | Yes — sandboxed + signature-verified |
| Installation model | n/a (copyable template) | `listing_only` or `native_builtin` | `signed_package_future` |
| User action | **Copy** a sanitized template into their own space | Read listing; install only if `native_builtin` | Install verified package (gated) |
| Status in Phase 2 | **Production-ready (free)** | **Production-ready (metadata, reviewed)** | **Do-not-launch-until-reviewed** |

`InstallationModel = ["listing_only", "native_builtin", "signed_package_future"]`.
Phase 2 ships `listing_only` and references to `native_builtin` plugins that are
already part of the Leda app. `signed_package_future` is documented for forward
compatibility and is **not** implemented — no user-uploaded executables are ever
accepted (see security doc).

---

## 7. Permissions / security model summary

Full detail in `MARKETPLACE_SECURITY.md`. Summary:

- **No arbitrary code, ever.** Workflow templates are declarative JSON limited to
  `WORKFLOW_NODE_TYPES`. Uploads of Python/JS/shell/exe/zip, cookies, secrets,
  API keys, `.env` files, local file paths, and hidden nodes are rejected.
- **Sensitive nodes need confirmation/verification.** Nodes in
  `SENSITIVE_NODE_TYPES` (`call_native_plugin`, `call_dify_plugin`, `notify_user`)
  must be gated by an `ask_confirmation` and/or `verify_result` node before they
  take effect — enforced by the validator.
- **RLS everywhere.** The browser uses only the anon key; Postgres Row Level
  Security decides what each role can read/write. The service role key lives only
  in `import "server-only"` modules.
- **Copy is sanitized.** Copying a workflow strips owner/private metadata, IDs,
  and never carries secrets — only the public declarative graph is reproduced.
- **Audit + rate limits.** All moderator actions are logged; submissions,
  reviews, and reports are rate-limited (`RATE_LIMITS`).

---

## 8. Payment plan (future, feature-flagged off)

Payments are **off by default** and **hard-gated** behind
`MARKETPLACE_PAYMENTS_ENABLED=true` (`paymentsEnabled()`), AND require Stripe keys
to be configured. While off:

- All content is **free** (`pricing_model: "free"`).
- No Stripe calls are made; no Stripe client is initialized.
- Paid UI renders as "coming later" rather than a checkout.

When enabled (Phase 3, after legal/tax/payout review):

- **Stripe Connect** — creators onboard via `CreatorPayoutProfile`
  (`onboarding_status`, `payouts_enabled`). Funds route to the creator's
  connected account.
- **Platform fee** — `PLATFORM_FEE_BPS = 1000` (10%), shown to creators before
  publishing and recorded per order as `platform_fee_amount`.
- **Orders + entitlements** — purchases create a `MarketplaceOrder`
  (`OrderStatus`) and a `MarketplaceEntitlement` (`purchased`). Free items get a
  `free` entitlement; admins can `admin_granted`.
- **Refunds / disputes** — `OrderStatus` includes `refunded` and `disputed` as
  **placeholders**. The handling flows (refund issuance, dispute evidence,
  chargeback accounting) are **not implemented** and must not launch until
  reviewed.
- **Secrets** — `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are read only in
  server-only modules; only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` reaches the
  browser.

---

## 9. Phased rollout

| Phase | Scope | Gating |
| --- | --- | --- |
| **2a** | Free **workflow templates** + **reviewed plugin listings**; browse/copy; demo-mode-first | Ships now. No payments. |
| **2b** | Accounts & profiles; social (likes, bookmarks, follows, reviews) | Requires Supabase configured for persistence; demo fallback otherwise. |
| **2c** | Moderation hardening — full queue, audit log review, report triage, rate-limit/anti-spam tuning, trust-tier workflow | Requires 2b + moderator role assignment. |
| **3** | **Paid sales** via Stripe Connect (one-time/subscription/donation), payouts, refunds/disputes | **Only after legal, tax, and payout review.** Hard-gated by `MARKETPLACE_PAYMENTS_ENABLED`. |

---

## 10. Production-ready vs demo-only vs do-not-launch-until-reviewed

| Capability | Status | Notes |
| --- | --- | --- |
| Browse workflow/plugin galleries (seed data) | **Demo-only** | Real data needs Supabase; seed content is labeled "Demo". |
| Domain types + config + flags | **Production-ready** | Single source of truth; client-safe. |
| Demo-mode reads (seed JSON) | **Production-ready** | No network, no crash with empty env. |
| Demo "sign-in" (cookie) | **Demo-only** | Not real auth; never use for trust decisions. |
| Workflow validator (node allowlist, JSON-only, sensitive-node gating) | **Production-ready** | Structural security guarantee. |
| Plugin listing validator (no code/secrets/exe, link sanity) | **Production-ready** | Metadata-only enforcement. |
| Copy-workflow (sanitized) | **Production-ready** | Strips private metadata/secrets. |
| Likes / bookmarks / follows / reviews | **Demo-only → 2b** | Mutations are `{ok:true,demo:true}` until Supabase. |
| Submit workflow / plugin | **Demo-only → 2b** | Validated, but not persisted in demo mode. |
| Human moderation queue + audit log | **Demo-only → 2c** | Requires Supabase + moderator role. |
| Rate limiting / anti-spam | **Placeholder** | `RATE_LIMITS` defined; real enforcement is server-side, to harden in 2c. |
| Supabase RLS policies | **Do-not-launch-until-reviewed** | Must be authored and audited before real data goes live. |
| Stripe Connect / checkout / webhook | **Do-not-launch-until-reviewed** | Flagged off; scaffolding only. |
| Refunds / disputes | **Do-not-launch-until-reviewed** | `OrderStatus` placeholders only; no flow implemented. |
| Signed installable plugin packages | **Do-not-launch-until-reviewed** | `signed_package_future`; no executable uploads accepted. |
| Payouts (`CreatorPayoutProfile`) | **Do-not-launch-until-reviewed** | Requires legal/tax/KYC review. |

---

## 11. Honesty and content labeling

- All seed records set `is_demo: true` and render a visible **"Demo"** badge.
- No page presents fabricated user counts, ratings, reviews, downloads, revenue,
  testimonials, or partnerships as real.
- Engagement counters (`like_count`, `copied_count`, `rating_count`, …) reflect
  only real activity once a real backend exists; in demo mode they are seed
  values shown alongside the "Demo" label and are never presented as live
  community metrics.
