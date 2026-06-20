# Leda — Your AI Operating Layer (Website)

A standalone, dark-themed marketing site for **Leda**, a desktop-first AI
workspace. It explains what Leda does, lets people download the desktop app
(when a build is available), showcases workflows and plugins, collects waitlist
emails, and lays the groundwork for a future plugin/workflow marketplace.

> This is a **separate web project** from the Python Leda desktop application.
> It contains no source code, assets, or branding from any other product.

Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.
All visuals are CSS/SVG — no external image assets, no paid dependencies.

---

## Quick start

```bash
# 1. install dependencies
npm install

# 2. (optional) configure environment
cp .env.example .env.local      # On Windows PowerShell: Copy-Item .env.example .env.local

# 3. run the dev server
npm run dev
```

Then open **http://localhost:3000**.

### All commands

| Command         | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm install`   | Install dependencies                          |
| `npm run dev`   | Start the dev server at `localhost:3000`      |
| `npm run build` | Create a production build                     |
| `npm run start` | Serve the production build (after `build`)    |

---

## Pages

| Route        | Page                                                |
| ------------ | --------------------------------------------------- |
| `/`          | Home — hero, product mockup, how it works, why Leda |
| `/download`  | Download — Windows prototype card + setup steps     |
| `/workflows` | Workflow gallery with detail modal + node diagrams  |
| `/plugins`   | Trusted tools/plugins showcase with permissions     |
| `/about`     | Vision + roadmap timeline                            |
| `/privacy`   | Privacy & safety commitments and boundaries         |
| `/changelog` | Release log (from a JSON file)                       |
| `/contact`   | Waitlist form + contact card                         |

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values as they become available.
**No secrets are required** to run this site.

| Variable                                | Purpose                                                        |
| --------------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_LEDA_WINDOWS_DOWNLOAD_URL` | Public URL for the Windows build. Empty = "coming soon" state. |
| `NEXT_PUBLIC_LEDA_GITHUB_URL`           | GitHub URL used in the navbar/footer.                          |
| `NEXT_PUBLIC_SITE_URL`                  | Canonical site URL (used for SEO / sitemap). Optional.         |
| `WAITLIST_STORAGE_MODE`                 | `local` (save to `data/waitlist.json`) or `demo` (no storage). |

> ⚠️ `NEXT_PUBLIC_*` variables are read at build/start time. After changing
> `.env.local`, **restart the dev server** for changes to take effect.

---

## How to change the Windows download link later

1. Open `.env.local` (create it from `.env.example` if needed).
2. Set the real release URL:

   ```bash
   NEXT_PUBLIC_LEDA_WINDOWS_DOWNLOAD_URL=https://example.com/downloads/Leda-Setup.exe
   ```

3. Restart the dev server (`npm run dev`).

When this variable is **empty**, the download button is disabled and reads
**"Windows download coming soon."** When set, it becomes an active download
button pointing at your URL. The logic lives in
[`components/DownloadButton.tsx`](components/DownloadButton.tsx).

---

## How to add a new workflow card

Workflows are pure data — edit one file, no components to touch.

1. Open [`content/workflows.json`](content/workflows.json).
2. Add an object to the array:

   ```json
   {
     "slug": "my-new-workflow",
     "title": "My New Workflow",
     "summary": "One-line description shown on the card.",
     "category": "Productivity",
     "status": "coming-soon",          // "available" | "in-development" | "coming-soon"
     "risk": "low",                     // "low" | "medium" | "high"
     "tools": ["Workflow Builder"],
     "trigger": "When this workflow runs.",
     "steps": ["Step one.", "Step two.", "Step three."],
     "permissions": ["What it can do.", "What it will not do."]
   }
   ```

3. Save. The card and its detail modal (with the node diagram) are generated
   automatically.

## How to add a new plugin card

1. Open [`content/plugins.json`](content/plugins.json).
2. Add an object to the array:

   ```json
   {
     "slug": "my-plugin",
     "name": "My Plugin",
     "category": "Communication",       // matches a filter on the Plugins page
     "badge": "experimental",           // "official" | "experimental" | "in-development"
     "status": "coming-soon",           // "available" | "in-development" | "coming-soon"
     "description": "What this plugin does.",
     "permissions": [
       "Short summary shown on the card.",
       "Extra detail revealed by 'Learn more'.",
       "Another permission line."
     ]
   }
   ```

3. Save. The first permission is the card summary; the rest appear under
   **Learn more**.

## How to add a changelog entry

Edit [`content/changelog.json`](content/changelog.json) and add an entry to the
top of the array. Use `"status": "current"` for the latest release (others use
`"released"`).

---

## Waitlist storage (demo backend)

The waitlist form posts to `app/api/waitlist/route.ts`. Behaviour is controlled
by `WAITLIST_STORAGE_MODE`:

- **`local`** — submissions are appended to `data/waitlist.json` on the server.
  This file is git-ignored. Good for local testing.
- **`demo`** — submissions are validated and acknowledged, but **not stored**.
  The form shows a clear "demo mode" notice.

To plug in a real database or email service later, replace the `persist()`
function in `app/api/waitlist/route.ts`. The form never collects secrets.

---

## Project structure

```
leda-website/
├── app/                  # App Router pages, layout, API route, sitemap, robots
│   ├── api/waitlist/     # Demo waitlist backend
│   ├── (pages)/          # download, workflows, plugins, about, privacy, ...
│   ├── layout.tsx        # Root layout, metadata, nav + footer
│   ├── icon.svg          # Favicon (placeholder logo mark)
│   └── globals.css       # Tailwind + design tokens
├── components/           # Reusable UI + section components
│   └── ui/               # Button, Card, Badge, Container, Section primitives
├── content/              # Editable data: workflows / plugins / changelog (JSON)
├── lib/                  # Site config, env config, typed data layer
├── public/               # logo.svg placeholder
└── .env.example          # Environment variable template
```

---

## Design & content principles

- **Honest labels everywhere:** `Available now`, `In development`, `Coming soon`,
  `Experimental`. No feature is claimed that doesn't exist yet.
- **No fake social proof:** no testimonials, user counts, funding, reviews,
  partnerships, or download numbers.
- **Accessible:** semantic headings, visible focus states, keyboard-navigable
  menu and modal, sufficient contrast, skip-to-content link.
- **No heavy blur / glass effects**, no external fonts fetched at build time.

---

# Phase 2 — Leda Marketplace

A secure community marketplace for **safe workflow templates** and **reviewed
plugin listings**, built as a clean extension of the site above. It is
**demo-mode-first**: it runs fully with **no Supabase or Stripe configured**.

> Full design docs: [`MARKETPLACE_PLAN.md`](MARKETPLACE_PLAN.md),
> [`MARKETPLACE_SECURITY.md`](MARKETPLACE_SECURITY.md),
> [`SUPABASE_MARKETPLACE_SETUP.md`](SUPABASE_MARKETPLACE_SETUP.md),
> [`docs/marketplace-api.md`](docs/marketplace-api.md),
> [`docs/moderation-policy.md`](docs/moderation-policy.md).

## Run it (same commands — no new setup required)

```bash
npm install
npm run dev          # marketplace lives at http://localhost:3000/marketplace
npm run typecheck    # tsc --noEmit
npm test             # vitest — validation + feature-flag tests (67 tests)
npm run build        # production build
```

With no `.env.local`, the marketplace is in **demo mode**: reads come from seed
data in `content/marketplace/*.json`, all content carries a visible **Demo**
badge, and mutations (like/copy/submit/review) are validated and acknowledged
but **not persisted**.

### Exploring gated pages in demo mode

There is no real auth in demo mode. The marketplace sub-nav has a **"Demo
identity"** switcher (top-right) that sets a local, non-`httpOnly` cookie so you
can preview each role:

| Role | Unlocks |
| --- | --- |
| Guest | public browsing only |
| User | like / bookmark / copy / review / report |
| Creator | `/creator/dashboard`, `/creator/submit/workflow`, `/creator/submit/plugin` |
| Moderator | `/moderation` queue |
| Admin | `/admin` dashboard |

This switcher is **demo-only** and is ignored the moment real Supabase auth is
configured.

## Marketplace pages

| Route | Page |
| --- | --- |
| `/marketplace` | Home — featured workflows/plugins, categories, creators, safety message |
| `/marketplace/workflows` · `/[slug]` | Workflow gallery (filters/sort) + detail with read-only graph |
| `/marketplace/plugins` · `/[slug]` | Plugin listing directory + detail with permissions & install state |
| `/marketplace/creators` · `/u/[handle]` | Creator directory + public profile |
| `/creator/dashboard` · `/creator/submit/*` | Creator dashboard + workflow/plugin submission flows |
| `/moderation` · `/admin` | Human moderation queue + admin dashboard (gated) |
| `/marketplace/policies` · `/creator-guidelines` · `/plugin-safety` · `/report` | Policy & safety pages |

## Accounts & profiles

Real user accounts are supported and **demo-mode-safe**. With Supabase
configured you get email/password **and** Google ("Continue with Google")
sign-in; with no Supabase env set, the auth pages stay up and the actions return
a friendly *"Connect Supabase to enable real accounts."* message instead of
crashing.

| Route | Page |
| --- | --- |
| `/signup` | Create an account — email/password or Google |
| `/login` | Sign in — email/password or Google |
| `/account` | Edit your profile (display name, handle, bio, website, avatar) + sign out |
| `/u/[handle]` | Public profile page |

A `profiles` row is **auto-created on signup** by a database trigger (the handle
is derived from the email). To turn on real accounts and Google sign-in, follow
**"Enabling real accounts (Email + Google sign-in)"** in
[`SUPABASE_MARKETPLACE_SETUP.md`](SUPABASE_MARKETPLACE_SETUP.md). All secrets
(service-role key, provider secret) stay server-only.

## New environment variables

All optional — leave empty for demo mode. See [`.env.example`](.env.example).

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL | public |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected) | public |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server key — **bypasses RLS** | **server-only** |
| `MARKETPLACE_PAYMENTS_ENABLED` | `false` (default) hard-gates all checkout | server |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | public |
| `STRIPE_SECRET_KEY` | Stripe secret | **server-only** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | **server-only** |

Server-only values are read **only** inside files that begin with
`import "server-only";` and are never imported by a client component.

## Enabling Supabase (turns demo mode → real backend)

Summary (full steps in [`SUPABASE_MARKETPLACE_SETUP.md`](SUPABASE_MARKETPLACE_SETUP.md)):

1. Create a Supabase project; copy the URL, anon key, and service-role key.
2. Put them in `.env.local` (anon/url are `NEXT_PUBLIC_*`; service key is server-only).
3. Run the migrations in order — `supabase/migrations/0001 → 0004` — via the
   Supabase SQL editor or `supabase db push`. This creates all 15 tables, the
   enum CHECK constraints, and **Row Level Security policies on every table**.
4. Enable email/password auth; (optional) create `avatars`/`screenshots` storage buckets.
5. Restart `npm run dev`. The data facade and auth layer automatically switch
   from seed data to Supabase once the env vars are present.

## Enabling Stripe (test mode) — optional, gated

Real checkout stays **off** until `MARKETPLACE_PAYMENTS_ENABLED=true` **and**
keys are set. To wire up Stripe Connect in **test mode**:

1. In the Stripe dashboard, switch to **Test mode** and copy `pk_test_…` / `sk_test_…`
   (Developers → API keys). Enable **Connect** (for creator payouts; Express accounts).
2. Set in `.env.local`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`,
   `STRIPE_SECRET_KEY=sk_test_…`, and `MARKETPLACE_PAYMENTS_ENABLED=true`.
3. Forward webhooks locally:
   `stripe listen --forward-to localhost:3000/api/marketplace/stripe/webhook`,
   then set the printed `whsec_…` as `STRIPE_WEBHOOK_SECRET`.
4. Orders/entitlements are only created **after a verified webhook**; price and
   entitlement are never trusted from the browser.

> The checkout/payout wiring is intentionally left as a documented TODO. **Do not
> enable payments in production** until payout, refund, dispute, and tax
> obligations have been reviewed.

## Workflow Template vs Plugin Listing vs Signed Package

These are three deliberately different things:

| | **Workflow Template** | **Plugin Listing** | **Signed Plugin Package** (future) |
| --- | --- | --- | --- |
| What it is | Declarative JSON graph of allowed nodes | Metadata describing a tool | A reviewed, signed installable bundle |
| Contains code? | **No** — only the node types in `WORKFLOW_NODE_TYPES` | **No** — text/links/images only | Yes, but signed & reviewed out-of-band |
| Installs/runs anything? | No — you *copy* it into your workspace to review | No — it's a directory entry | Only after a separate signing/review system exists |
| Available now? | ✅ copy in demo | ✅ listings only | ❌ not built — `installation_model: signed_package_future` |

The marketplace **never** accepts executable uploads, Python/JS/shell, `.exe`/
`.zip`, cookies, secrets, API keys, or `.env` files. The validators in
`lib/marketplace/validation/` enforce this and are covered by 67 unit tests.

## Adding marketplace content (demo data)

Edit the JSON in `content/marketplace/` — `workflows.json`, `plugins.json`,
`creators.json`, `categories.json`, `reviews.json`. Shapes must match the types
in [`lib/marketplace/types.ts`](lib/marketplace/types.ts). Keep `is_demo: true`
on seed entries so they stay visibly labeled.

## Launch readiness (what to ship vs hold)

| Status | Areas |
| --- | --- |
| ✅ **Production-grade logic** | Workflow/plugin validation (security core, 67 tests), demo data layer, type contract, SQL schema + RLS policies, honest status/permission labeling, accessibility |
| 🟡 **Demo-only (needs Supabase/real auth before launch)** | Cookie-based demo sign-in & role switcher, in-memory rate limiting, file-based audit log, all mutations (like/bookmark/follow/review/report/submit/copy persist nothing in demo) |
| 🔴 **Do not launch until reviewed** | Stripe payments/payouts (gated off; checkout wiring is TODO), community plugin *installation*/signing, and anything involving money, PII, or executing third-party content. Requires security, legal, payout/tax review first. |

Start the public launch with **free workflow templates + reviewed plugin
listings only**; keep paid creator sales off until the free marketplace,
moderation, and payout/refund/tax handling are all in place.

---

## License / usage

Internal early-product website for Leda. Replace placeholder links
(`hello@leda.ai`, social links, GitHub) before any public launch.
