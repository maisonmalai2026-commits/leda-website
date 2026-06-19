# Leda Marketplace — Security Model & Threat Model (Phase 2)

> This document describes the threat model and the defenses that make the
> marketplace safe **by construction**: it stores and displays declarative
> metadata, never arbitrary code. It also states plainly **what is not done yet**.

---

## 1. Security posture in one paragraph

The marketplace never executes, installs, or runs anything. Workflow templates
are **declarative JSON** restricted to a fixed allowlist of node types
(`WORKFLOW_NODE_TYPES`); plugin entries are **metadata-only listings**. There is
no upload path for executables, archives, or scripts. Secrets and credentials are
rejected on the way in and stripped on the way out (copy). Server-only secrets
never reach the browser. Every privileged read/write is mediated by Postgres Row
Level Security, and every moderator action is human-driven and audit-logged.

---

## 2. Threat model

### Assets we protect

- End users who **copy** templates and read listings (must not be tricked into
  harmful automations or into leaking credentials).
- The platform's reputation and legal standing (no malware distribution).
- User accounts, sessions, and any future payment/payout data.
- Server-only secrets (service role key, Stripe secret/webhook keys).

### Adversaries / abuse cases

1. **Malicious creator** tries to smuggle executable code, an exe/zip, a script,
   or a credential-stealing step into a submission.
2. **Deceptive creator** builds a workflow that *looks* benign but silently
   performs sensitive actions (sends data out, calls a plugin) without user
   confirmation.
3. **Data exfiltration** — a submission that scrapes cookies, reads `.env`/local
   files, or harvests API keys/secrets.
4. **Secret leakage via copy** — a copied workflow carries the original author's
   private metadata or secrets.
5. **Privilege escalation** — a non-moderator tries to approve content, read
   another user's private data, or write to tables they shouldn't.
6. **Spam / abuse** — bulk submissions, review-bombing, mass reporting,
   fake reviews, impersonation.
7. **Secret exposure** — service-role / Stripe keys leaking into the client
   bundle or logs.
8. **Phishing via links** — listing/source/support URLs that point somewhere
   harmful.

### Why "no arbitrary code / exe / zip / cookies / secrets"

Distributing runnable content is the single largest risk: it turns the
marketplace into a malware vector and creates legal/abuse liability. By storing
**only declarative metadata**, the worst a malicious submission can encode is a
description of an automation — which is still human-reviewed, still limited to a
known node allowlist, and still requires explicit user confirmation for sensitive
actions. Cookies, secrets, API keys, `.env` files, and local file paths have **no
legitimate reason** to appear in a shared template or listing; their presence is a
strong signal of credential theft or exfiltration intent, so they are rejected
outright.

---

## 3. Workflow template validation rules

The workflow validator runs **before** a submission can enter the moderation
queue and again on copy. It returns a `ValidationResult { ok, issues }` where each
`ValidationIssue` has `severity` (`error` | `warning`), a `code`, a `message`, and
an optional `path` (node id / field). **Any `error` blocks submission.**

Rules (enumerated):

1. **Node-type allowlist.** Every `node.type` must be in `WORKFLOW_NODE_TYPES`
   (`manual_trigger`, `schedule_trigger`, `main_brain`, `call_native_plugin`,
   `call_dify_plugin`, `condition`, `ask_confirmation`, `wait`, `verify_result`,
   `notify_user`, `end`). Any other/unknown/hidden type → **error**.
2. **No hidden / undeclared nodes.** Nodes not reachable from a trigger, nodes
   with unknown types, or nodes flagged hidden → **error**. The displayed
   `preview_graph_json` must be derivable from `workflow_json` (no secret
   off-graph behavior).
3. **Exactly-one trigger entry.** The graph must start with a node in
   `TRIGGER_NODE_TYPES` (`manual_trigger` | `schedule_trigger`) and must contain a
   reachable `end`. Missing trigger or missing terminal → **error**.
4. **JSON-only config.** `node.config` must be JSON-safe (`JsonValue` only).
   Functions, code strings, `eval`-like payloads, script bodies, or non-JSON
   values → **error**.
5. **No code/executable payloads.** Reject any field whose content looks like
   Python/JavaScript/shell/PowerShell/batch, or references `.exe`, `.zip`,
   `.dll`, `.sh`, `.ps1`, `.bat`, `.jar`, or similar executable/archive
   artifacts → **error**.
6. **No secrets / credentials.** Reject cookies, session tokens, API keys, bearer
   tokens, passwords, private keys, `.env` contents, connection strings, crypto
   wallet seeds/private keys → **error**.
7. **No local/host file paths.** Reject absolute local paths
   (`C:\...`, `/home/...`, `/Users/...`, UNC paths) and file-system traversal
   (`../`) in config → **error**.
8. **Edges reference real nodes.** Every `WorkflowEdge.source`/`target` must
   reference an existing node id; no dangling/duplicate edges → **error**.
9. **Declared plugins/permissions must match.** Plugins used by
   `call_native_plugin` / `call_dify_plugin` nodes must appear in
   `required_plugins`; outbound capabilities must be reflected in
   `declared_permissions`. Mismatch (undeclared capability) → **error**.
10. **Sensitive nodes require gating** (see §4) → **error** if missing.
11. **Risk labeling.** `risk_level` must be consistent with the nodes present
    (e.g. presence of sensitive nodes implies at least `medium`). Inconsistent
    labeling → **warning** (moderator confirms).
12. **Size / shape limits.** Bound node count, edge count, label/description
    lengths, and nesting depth to prevent abuse → **error** when exceeded.

---

## 4. Confirmation / verification requirement for sensitive actions

`SENSITIVE_NODE_TYPES = ["call_native_plugin", "call_dify_plugin", "notify_user"]`
perform potentially outbound or side-effecting actions. The validator requires
that **before** any sensitive node takes effect there is an explicit human gate on
the path leading to it:

- An **`ask_confirmation`** node must appear upstream so the user explicitly
  approves the sensitive action, **and/or**
- A **`verify_result`** node must follow to confirm the outcome before the
  workflow proceeds to further sensitive steps.

A workflow that reaches a sensitive node with **no** upstream `ask_confirmation`
(and no compensating `verify_result`) is rejected with an **error**. This makes
"silently does something sensitive" structurally impossible to publish. There is
no flag or config that bypasses this gate — any attempt to encode a
permission/verification bypass is itself a rejectable policy violation.

---

## 5. Plugin listing validation rules

Plugin listings are **metadata only** — no binary, no code is ever stored. The
plugin validator enforces:

1. **No executable/archive/code** anywhere in the listing text or fields
   (same artifact and code-string rejection as workflow rule 5) → **error**.
2. **No secrets/credentials** in any field (same as workflow rule 6) → **error**.
3. **Installation model allowlist.** `installation_model` must be one of
   `listing_only`, `native_builtin`, `signed_package_future`. **No user-uploaded
   package is accepted** in Phase 2; `signed_package_future` is documented but not
   installable → uploads → **error**.
4. **Link sanity.** `source_url`, `documentation_url`, `support_url`, `icon_url`,
   and `screenshots` must be well-formed `http(s)` URLs (no `javascript:`,
   `data:`, `file:`, or local paths) → **error**.
5. **Declared permissions + `cannot_access`.** `declared_permissions` must be a
   list of known permission strings; `cannot_access` is shown to users for
   transparency. Undeclared/over-broad permission requests → **warning** for
   moderator scrutiny.
6. **Trust tier is moderator-assigned.** A submitter cannot self-set
   `trust_status` to `official`/`verified`; any such attempt is ignored and
   defaults to `community`/`experimental` pending review.
7. **Size/shape limits** on text fields, tag counts, screenshot counts → **error**
   when exceeded.

---

## 6. Row Level Security (RLS) strategy

The browser holds only the **anon key**; all enforcement is in Postgres RLS.
The **service role key** is used only inside `import "server-only"` modules for
privileged operations (moderation writes, admin grants) and is never shipped to
the client.

| Data | Guest | User | Creator (owner) | Moderator | Admin |
| --- | --- | --- | --- | --- | --- |
| `WorkflowTemplate` / `PluginListing` where `moderation_status='approved'` AND `visibility='public'` | read | read | read | read | read |
| Own `draft`/`pending`/`changes_requested` content | — | — | read/write own | read all | read all |
| Other users' non-public content | — | — | — | read | read |
| `Profile` where `profile_visibility='public'` | read | read | read | read | read |
| Private `Profile` | — | read own | read own | read | read |
| `MarketplaceReview` where `moderation_status='visible'` | read | read | read | read | read |
| Create/edit/delete **own** review | — | write own | write own | write own | write own |
| Hide/unhide any review | — | — | — | write | write |
| `MarketplaceLike` / `Bookmark` / `CreatorFollow` | — | write own | write own | write own | write own |
| `MarketplaceReport` | — | create own | create own | read/triage all | read/triage all |
| `ModerationAction` (audit log) | — | — | — | append; read | read all |
| `CreatorPayoutProfile` / `MarketplaceOrder` / `Entitlement` | — | read own | read own | read (support) | read all |
| Roles, categories, trust tiers, flags, `admin_granted` entitlements | — | — | — | — | write |

Principles:

- **Deny by default.** No row is readable/writable unless a policy explicitly
  allows it for the caller's role.
- **Ownership checks** use the authenticated user id, never a client-supplied id.
- **Moderation/audit writes** go through server-only code with the service role,
  so they cannot be forged from the browser.
- **Demo mode never uses RLS** — it reads seed JSON and persists nothing; the
  demo "session" is a cookie and must never be treated as a trust boundary.

> **Not done yet:** the concrete RLS SQL policies must be authored and audited
> before any real data goes live (see §12).

---

## 7. Server-only secret handling

- Files that read `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or
  `STRIPE_WEBHOOK_SECRET` **must** have `import "server-only";` as their first
  line, which makes Next.js fail the build if they are imported into a client
  component.
- Only `NEXT_PUBLIC_*` values (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `STRIPE_PUBLISHABLE_KEY`, `APP_URL`) are client-safe. `lib/marketplace/config.ts`
  reads only these and is the only config surface a client component touches.
- Secrets are **never** logged, embedded in error messages, returned in an
  `ActionResult`, or written into copied/exported content.
- Clients (Supabase, Stripe) are **lazily initialized** behind
  `isSupabaseConfigured()` / `paymentsEnabled()`, so missing env never crashes the
  app and never accidentally constructs a privileged client in the browser.

---

## 8. Copy-workflow sanitization

When a user copies a public workflow template, the copy pipeline:

- Re-runs the workflow validator on the source graph (defense in depth).
- Reproduces **only** the public declarative graph (`workflow_json` /
  `preview_graph_json`) — nodes, edges, and JSON-safe config.
- **Strips** owner identity, internal IDs, `owner_id`, moderation/audit fields,
  engagement counters, and any private metadata.
- **Never** copies secrets, tokens, cookies, or credentials — by construction
  these cannot be present (rejected at submission) and are filtered again on copy.
- Marks the result as the copier's own new draft; it does not inherit the
  original's `moderation_status` or trust signals.

In demo mode the copy action validates and sanitizes, then returns
`ActionResult { ok: true, demo: true }` without persisting.

---

## 9. Rate limiting & anti-spam (placeholders)

`RATE_LIMITS` (in config) defines starting budgets, enforced **server-side**:

| Action | Window | Max |
| --- | --- | --- |
| Submission | 60s | 3 |
| Review | 60s | 5 |
| Report | 60s | 5 |

Planned anti-spam measures (to harden in Phase 2c, **not fully done yet**):

- Per-user and per-IP throttling; exponential backoff on repeated failures.
- Duplicate-content detection on submissions and reviews.
- One review per user per target; edits update the existing review.
- Report de-duplication and review-bombing detection.
- New-account / unverified-account stricter limits.

> The in-memory budgets are a placeholder. Real, durable rate limiting must be
> implemented server-side before relying on it in production.

---

## 10. Moderation & audit logging

- All state transitions (approve / reject / request-changes / verify / deprecate
  / remove, hide/unhide review, resolve/dismiss report, role/trust changes) are
  performed by humans and recorded as a `ModerationAction` row
  (`moderator_id`, `action`, `reason`, `metadata`, `created_at`).
- AI may **assist** moderators (flagging, summarizing) but never decides.
- The audit log is append-only from the moderator path and readable by
  moderators/admins for accountability.

---

## 11. Reporting flow

1. A signed-in user files a `MarketplaceReport` (`target_type`, `target_id`,
   `reason`, optional `details`). Initial `status = "open"`.
2. A moderator picks it up → `status = "reviewing"` (`moderator_id` set).
3. The moderator acts on the underlying content (e.g. request changes / remove /
   hide review), writing a `ModerationAction`.
4. The report is closed as `resolved` or `dismissed` with `resolved_at` set.
5. Reports are rate-limited and de-duplicated to prevent mass-report abuse.

---

## 12. What is explicitly NOT done yet

- **RLS policy SQL** is not authored/audited in this phase — required before real
  data goes live.
- **Durable rate limiting / anti-spam** is a placeholder (`RATE_LIMITS` only);
  real server-side enforcement is pending Phase 2c.
- **Real authentication** — demo mode uses a cookie "sign-in" that is **not** a
  security boundary. Supabase Auth wiring lands with persistence (2b).
- **Stripe payments / Connect / webhook** are scaffolded and **hard-gated off**;
  refunds and disputes are `OrderStatus` placeholders with no implemented flow.
- **Signed installable plugin packages** (`signed_package_future`) — no
  executable upload, sandbox, or signature verification exists; only listings.
- **Payouts / KYC** (`CreatorPayoutProfile`) require legal/tax review before use.
- **Abuse tooling** (account-level bans, IP intelligence, appeals automation) is
  minimal and to be hardened in 2c.
