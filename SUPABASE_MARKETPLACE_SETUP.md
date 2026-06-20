# Supabase setup for the Leda Marketplace (Phase 2)

This guide takes you from zero to a working Supabase backend for the Leda
Marketplace. **You do not need any of this to develop or demo the marketplace** —
with no Supabase variables set, the app runs in local **demo mode** against a
JSON seed, uses a cookie-based demo sign-in, and never makes a network call.

Follow these steps only when you want real auth, a real database, and persisted
data protected by Row Level Security (RLS).

---

## 0. What you are building

The SQL lives in `supabase/`:

| File | Purpose |
| --- | --- |
| `migrations/0001_init.sql` | Extensions, `profiles`, `marketplace_categories` |
| `migrations/0002_marketplace.sql` | All content/social/commerce tables |
| `migrations/0003_rls.sql` | Enables RLS + every access policy |
| `migrations/0004_functions_triggers.sql` | `updated_at` triggers, auto-profile on signup, `is_moderator()` / `is_admin()` |
| `seed.sql` | A few starter categories (+ commented example content) |

Column names match `lib/marketplace/types.ts` one-to-one, so the Supabase data
provider can map rows to the TypeScript types directly.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> and sign in.
2. Click **New project**. Pick an organization, a name (e.g. `leda-marketplace`),
   a strong database password (save it in your password manager), and a region
   close to your users.
3. Wait for the project to finish provisioning (about a minute).

---

## 2. Get your URL and API keys

In the dashboard, open **Project Settings → API**. You need three values:

| Dashboard label | Env var | Exposure |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | **Public** (safe in the browser) |
| Project API key — `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Public** (safe in the browser; protected by RLS) |
| Project API key — `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **SERVER ONLY — never expose** |

> **Why the anon key is safe to ship to the browser:** it can only do what RLS
> allows. The policies in `0003_rls.sql` are the entire access surface. The
> `service_role` key **bypasses RLS** and must therefore live only on the
> server.

---

## 3. Put the env vars in the right place

Copy `.env.example` to `.env.local` (this file is git-ignored) and fill in:

```bash
# Public app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- Supabase: PUBLIC values (browser-safe) ---
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...

# --- Supabase: SERVER ONLY (never exposed, never committed) ---
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key...
```

Rules the codebase enforces:

- **Public** (`NEXT_PUBLIC_*`) values are read by `lib/marketplace/config.ts` and
  may reach the browser.
- **Server-only** secrets (`SUPABASE_SERVICE_ROLE_KEY`, and later
  `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`) are read **only** inside modules
  whose first line is `import "server-only";`. Never import such a module from a
  client component.
- Once `NEXT_PUBLIC_SUPABASE_URL` **and** `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
  both present, `isSupabaseConfigured()` returns `true` and the app leaves demo
  mode. If either is missing, you stay in demo mode — nothing breaks.

Restart the dev server after editing `.env.local` so Next.js picks up the values.

---

## 4. Run the migrations

Run them **in order: 0001 → 0002 → 0003 → 0004**, then the seed. Pick one method.

### Option A — Supabase CLI (recommended)

1. Install the CLI: <https://supabase.com/docs/guides/cli> (`npm i -g supabase`
   or your platform's package manager).
2. Log in and link your project (the ref is in your Project URL):

   ```bash
   supabase login
   supabase link --project-ref YOUR-PROJECT-ref
   ```

3. Push the migrations (the CLI applies files in `supabase/migrations` in
   filename order, which is exactly 0001 → 0004):

   ```bash
   supabase db push
   ```

4. Apply the seed:

   ```bash
   # Re-runs migrations on a clean DB, then runs supabase/seed.sql:
   supabase db reset

   # …or just load the seed against the current database:
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```

   (`supabase db reset` is destructive — it rebuilds the local/linked database
   from scratch. Use it on fresh projects, not on one with real data.)

### Option B — SQL editor (no CLI)

1. In the dashboard, open **SQL Editor → New query**.
2. Paste the **entire** contents of `supabase/migrations/0001_init.sql` and click
   **Run**.
3. Repeat for `0002_marketplace.sql`, then `0003_rls.sql`, then
   `0004_functions_triggers.sql`, **in that order**.
4. Finally paste and run `supabase/seed.sql`.

The migrations are written to be re-run safely (`create table if not exists`,
`create or replace function`, `drop policy if exists` before each `create
policy`, triggers dropped before re-create). If a step errors, fix it and re-run
that file.

---

## 5. Enable email/password auth

1. In the dashboard, open **Authentication → Providers**.
2. Make sure **Email** is enabled. For local development you can turn **Confirm
   email** off so test signups work immediately; turn it back on for production.
3. Open **Authentication → URL Configuration** and set the **Site URL** to your
   `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` in dev). Add any extra
   redirect URLs you use.

When a user signs up, the `on_auth_user_created` trigger (from
`0004_functions_triggers.sql`) automatically inserts a matching row into
`public.profiles`, deriving a unique `handle` from the email local-part. You do
not create profiles by hand.

> To grant yourself moderator/admin powers, sign up, then in **Table editor →
> profiles** set your row's `role` to `moderator` or `admin`. The `is_moderator()`
> / `is_admin()` helpers read this column to gate report triage and moderation
> actions.

---

## Enabling real accounts (Email + Google sign-in)

This is the end-to-end checklist that turns the app's **demo identity** into
**real accounts**: email/password sign-up + sign-in and "Continue with Google".
It powers the `/login`, `/signup`, `/account`, and `/u/[handle]` pages.

> **Demo-mode fallback.** When `NEXT_PUBLIC_SUPABASE_URL` and
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` are **absent**, the app stays in demo mode:
> the auth actions return a friendly *"Connect Supabase to enable real
> accounts."* message instead of crashing, and the demo-identity switcher is
> used instead. Everything below is what makes real login work — none of it is
> required just to run or demo the site. **Secrets stay server-only:** the
> `service_role` key and any provider secret are read only inside
> `import "server-only";` modules and are never shipped to the browser.

### (a) Create the project and set the three env vars

If you have not already done so in sections **1–3** above:

1. Create the free Supabase project (section 1).
2. From **Project Settings → API**, copy these into `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key...   # server-only
   ```

   The first two are `NEXT_PUBLIC_*` (browser-safe, RLS-protected). The
   `service_role` key **bypasses RLS** and must never reach the browser.

### (b) Run the migrations (creates `profiles` + the auto-profile trigger)

Follow section **4** to run `supabase/migrations/0001 → 0004` in order. The
important pieces for accounts are:

- `0001_init.sql` creates the **`profiles`** table.
- `0004_functions_triggers.sql` installs the **`handle_new_user`** function and
  its **`on_auth_user_created`** trigger on `auth.users`. This is what
  **auto-creates a `profiles` row on every signup**, deriving a unique `handle`
  from the email local-part. You never create profiles by hand — sign in with
  email or Google and the row appears automatically.

### (c) Enable the Email and Google providers

In the dashboard, open **Authentication → Providers**:

1. **Email** — make sure it is **enabled**.
   - **Confirm email ON** (recommended for production): new users must click a
     link in their inbox before they can sign in. The app sends them to
     `<NEXT_PUBLIC_APP_URL>/auth/callback` after confirming.
   - **Confirm email OFF** (handy for local testing): signups work immediately
     with no inbox round-trip. Turn it back on before going live.
2. **Google** — toggle it **on**. You will paste the Client ID and Secret from
   step (d). Leave this tab open.

### (d) Create the Google OAuth client

In the [Google Cloud Console](https://console.cloud.google.com/):

1. Pick (or create) a project, then open **APIs & Services → Credentials**.
2. If prompted, configure the **OAuth consent screen** first (External user
   type; add an app name, support email, and your email as a test user).
3. Click **Create credentials → OAuth client ID** and choose
   **Application type: Web application**.
4. Under **Authorized redirect URIs**, add **exactly** this Supabase callback
   (this is Supabase's URL, *not* your app's):

   ```text
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```

   Replace `<PROJECT-REF>` with your project ref (the subdomain of your
   `NEXT_PUBLIC_SUPABASE_URL`).
5. Click **Create**, then copy the generated **Client ID** and **Client
   secret**.
6. Back in Supabase (**Authentication → Providers → Google** from step (c)),
   paste the **Client ID** and **Client secret** and **Save**.

### (e) Set Site URL and redirect URLs in Supabase

Open **Authentication → URL Configuration**:

1. **Site URL** — set to your app's base URL:
   - Local: `http://localhost:3000`
   - Production: your deployed URL (e.g. `https://your-app.vercel.app`)
2. **Redirect URLs** — add your app's callback for each environment so Supabase
   will redirect back after email confirmation and Google sign-in:

   ```text
   http://localhost:3000/auth/callback
   https://your-app.vercel.app/auth/callback
   ```

   The app always asks Supabase to redirect to
   `<NEXT_PUBLIC_APP_URL>/auth/callback` (the existing route at
   `app/auth/callback/route.ts` exchanges the OAuth code for a session). Make
   sure `NEXT_PUBLIC_APP_URL` in `.env.local` matches the Site URL above.

### (f) Restart the app

Stop and restart the dev server (`npm run dev`) so Next.js picks up the new
env vars. Now:

- **`/signup`** — email/password sign-up (sends a confirmation email if
  confirmation is on) and **Continue with Google**.
- **`/login`** — email/password sign-in and **Continue with Google**.
- **`/account`** — edit your profile (display name, handle, bio, website,
  avatar) and sign out.
- **`/u/[handle]`** — your public profile page.

The demo-identity switcher disappears the moment real auth is configured; the
session is the real Supabase one.

> **Troubleshooting Google:** a *redirect_uri_mismatch* error means the
> **Authorized redirect URI** in Google Cloud does not exactly match
> `https://<PROJECT-REF>.supabase.co/auth/v1/callback`. A successful Google
> login that then lands on an error usually means your app URL is missing from
> Supabase's **Redirect URLs** (step e).

---

## 6. Storage buckets (avatars + screenshots, metadata only)

The database stores **only URLs** (`avatar_url`, `icon_url`, `screenshots[]`),
never file bytes. Create buckets to host those files:

1. In the dashboard, open **Storage → Create a new bucket**.
2. Create a **public** bucket named `avatars` (profile pictures).
3. Create a **public** bucket named `screenshots` (plugin screenshots / icons).
4. (Optional) Add storage policies so authenticated users can upload only into a
   folder named after their own user id, e.g. `avatars/<uid>/...`. Reads stay
   public so images render in the gallery.

Then store the resulting public URL in the relevant column. Nothing executable is
ever uploaded — listings are metadata only.

---

## 7. How RLS protects your data

RLS is **enabled on every table** in `0003_rls.sql`. With RLS on and no matching
permissive policy, access is denied — so the policies are the complete access
surface. The key guarantees:

- **Public reads are limited.** Anonymous/visitor reads only see
  `workflow_templates` that are `visibility = 'public'` **and**
  `moderation_status = 'approved'`, `plugin_listings` that are `approved` and not
  `rejected`, profiles that are `public`, and active categories. Private drafts
  are invisible to everyone but their owner (and moderators).
- **Owners control only their own rows.** Insert/update/delete on
  `workflow_templates` / `plugin_listings` is scoped to `owner_id = auth.uid()`.
  Clients cannot reassign ownership (the `WITH CHECK` keeps `owner_id` pinned).
- **Private-by-default tables.** `marketplace_bookmarks`,
  `marketplace_entitlements`, and `creator_payout_profiles` are readable only by
  their owning user. `marketplace_orders` is readable only by the order's buyer
  or seller — so payment internals like `stripe_payment_intent_id` never leak to
  the public.
- **Moderation is privileged.** Only `is_moderator()` / `is_admin()` users can
  read/triage `marketplace_reports`, append to `moderation_actions`, or change
  `moderation_status`. A creator can additionally **read** moderation actions
  taken against their **own** content (so they see feedback), but cannot write
  any moderation data.
- **No auth emails are exposed.** `public.profiles` deliberately has no email
  column; emails live in `auth.users`, which clients cannot read.
- **The service role bypasses RLS.** Trusted server-only code (webhooks,
  privileged mutations) uses `SUPABASE_SERVICE_ROLE_KEY` and must run only inside
  `import "server-only";` modules. Never hand that key to the browser.

### Quick verification

1. Open an incognito browser (no session) and confirm only approved/public
   content is returned by the marketplace pages.
2. Sign in as a normal user and confirm you can edit your own draft but get an
   empty result (not an error leak) for someone else's private draft.
3. Promote a test account to `moderator` and confirm reports and the moderation
   queue become visible to it and only it.

---

## 8. Stripe (later, optional)

Payments are hard-gated off by default (`MARKETPLACE_PAYMENTS_ENABLED=false`).
All content is free until you flip that flag **and** configure Stripe keys. The
Stripe secret values (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are
**server-only**, exactly like the Supabase service role key — read only inside
`import "server-only";` modules, never committed, never exposed. The publishable
key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is browser-safe. Configuring Stripe is
out of scope for this database setup guide.

---

## Troubleshooting

- **App still shows "Demo" labels after adding env vars.** Both
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set, and
  you must restart the dev server.
- **A migration fails partway.** Fix the reported line and re-run that file — the
  migrations are written to be safely re-runnable.
- **New signups have no profile.** Confirm `0004_functions_triggers.sql` ran and
  that the `on_auth_user_created` trigger exists on `auth.users` (Database →
  Triggers).
- **Moderator can't see reports.** Confirm that account's `profiles.role` is
  `moderator` or `admin`.
