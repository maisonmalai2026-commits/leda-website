# Leda Marketplace — Moderation Policy

> This policy governs what may be published to the Leda Marketplace and how
> moderators review it. **Every submission is reviewed by a human.** There is no
> automated path to approval. AI may *assist* reviewers (flagging, summarizing)
> but never approves, rejects, or publishes content on its own.

---

## 1. Community rules (what is NOT allowed)

Content that does any of the following will be rejected or removed:

1. **Malware / harmful automation.** Anything designed to damage, disable, or
   gain unauthorized access to a device, account, or service.
2. **Credential theft.** Steps intended to capture passwords, tokens, API keys,
   private keys, or other credentials.
3. **Cookie / session extraction.** Reading, exporting, or transmitting cookies,
   session tokens, or auth state.
4. **Hidden / undisclosed data collection.** Exfiltrating user data, telemetry,
   files, or clipboard contents without clear disclosure and user consent.
5. **Deceptive workflows.** Content whose visible description does not match its
   actual nodes/behavior, or that hides sensitive actions from the user.
6. **Spam / bulk messaging.** Mass-messaging, bulk outreach, unsolicited
   contact, or content built primarily to spam.
7. **Fraud.** Scams, phishing, fake-offer flows, or anything intended to deceive
   for gain.
8. **Crypto wallet / seed handling.** Reading, generating, transmitting, or
   prompting for wallet seed phrases or private keys.
9. **Arbitrary executable uploads.** Any attempt to distribute executables,
   archives, scripts, or code (`.exe`, `.zip`, `.dll`, `.sh`, `.ps1`, `.bat`,
   `.jar`, Python/JS/shell, etc.). The marketplace stores **declarative metadata
   only** — there is no upload path for runnable artifacts.
10. **Fake reviews / ratings manipulation.** Self-reviews, sockpuppets,
    review-bombing, paid/incentivized reviews, or coordinated rating inflation.
11. **Impersonation.** Pretending to be another person, brand, or the Leda team;
    falsely claiming `official`/`verified` trust status.
12. **Copyright / IP violation.** Publishing content the submitter does not have
    the right to distribute.
13. **Permission / verification bypass.** Encoding a way around the required
    `ask_confirmation` / `verify_result` gate for sensitive actions, or
    misdeclaring permissions to hide capabilities.

Submissions that include secrets, `.env` contents, local file paths, hidden
nodes, or node types outside `WORKFLOW_NODE_TYPES` are rejected automatically by
the validator before they ever reach a human reviewer.

---

## 2. Moderation queue workflow

Content moves through the `moderation_status` lifecycle. Transitions are
performed by **Moderator+** and each writes a `ModerationAction` audit record.

```
draft ──submit──▶ pending
                    │
   ┌────────────────┼─────────────────────────┐
   ▼                ▼                          ▼
approve         request changes             reject
(approved)      (changes_requested)         (rejected)
   │                │                          │
   │            resubmit ──▶ pending           │
   │                                           │
   ├──▶ verify  (plugins: set trust_status)    │
   ├──▶ deprecate (approved → deprecated)      │
   └──▶ remove    (approved → removed)         │  (appealable)
```

Actions:

- **approve** → `approved`: content becomes public (subject to `visibility`).
- **request changes** → `changes_requested`: returned to the creator with a
  reason; they fix and resubmit (`→ pending`).
- **reject** → `rejected`: not published; reason recorded; appealable.
- **verify** (plugins): assign `trust_status` (`official` / `verified` /
  `community` / `experimental`). Trust is **assigned by moderators**, never
  self-claimed by submitters.
- **deprecate** → `deprecated`: kept visible but marked outdated/superseded.
- **remove** → `removed`: taken down for a policy violation.

Reviews have their own status (`visible` / `hidden` / `pending`) toggled by
moderators. Reports flow `open → reviewing → resolved | dismissed`.

Material edits to an `approved` item reset it to `pending` for re-review.

---

## 3. Reviewer guidelines

Reviewers should, for every `pending` item:

1. **Read the validator output first.** It enumerates structural issues (node
   allowlist, JSON-only config, sensitive-node gating, banned-content matches).
   Never approve an item with unresolved `error`-severity issues.
2. **Confirm description matches behavior.** The visible description, declared
   permissions, and `cannot_access` must honestly reflect the actual nodes.
   Reject deceptive or under-declared content.
3. **Scrutinize sensitive nodes.** For any `call_native_plugin`,
   `call_dify_plugin`, or `notify_user` node, verify there is an upstream
   `ask_confirmation` and/or a `verify_result` gate. No bypass is acceptable.
4. **Reject any code/exe/secret/cookie/wallet-seed signal**, even if the
   validator missed an edge case. When in doubt, request changes.
5. **Check plugin listings** for honest links (`source_url`, `documentation_url`,
   `support_url`), realistic `compatibility`/`required_apps`, and a sane
   `installation_model` (no package upload). Assign trust tiers conservatively —
   default to `community`/`experimental`; reserve `verified`/`official` for
   content the team can vouch for.
6. **Watch for spam, impersonation, and fake engagement.** Hide manipulated
   reviews; suspend repeat offenders' `creator_status`.
7. **Be honest in public signals.** Do not let fabricated metrics, fake reviews,
   or self-claimed partnerships through. Demo/seed content must remain clearly
   labeled and is never presented as real community activity.
8. **Always record a reason.** Every decision writes a `ModerationAction` with a
   reason and any relevant metadata, for accountability and appeals.

Reviewers act consistently and document rationale. AI assistance is advisory
only — the human reviewer owns the decision.

---

## 4. Appeals

A creator whose content was `rejected`, `removed`, or whose `creator_status` was
suspended may appeal. Appeals are reviewed by a **different** moderator (or an
admin) than the one who made the original decision where possible. The reviewer
re-examines the content and the recorded `ModerationAction` rationale, then
upholds or reverses the decision and records the outcome. Appeal handling
tooling is intentionally lightweight in this phase and will be hardened in
Phase 2c (moderation hardening).
