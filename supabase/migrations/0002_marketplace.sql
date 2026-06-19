-- ============================================================================
-- 0002_marketplace.sql — Leda Marketplace content + social + commerce tables
--
-- Creates every remaining table referenced by lib/marketplace/types.ts. Column
-- names match the TS interfaces 1:1. Enum-like columns use CHECK constraints
-- whose allowed values are exactly the const arrays in types.ts.
--
-- Depends on 0001_init.sql (profiles, marketplace_categories, extensions).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- workflow_templates  (interface WorkflowTemplate)
--
-- The aggregate/counter columns (copied_count, like_count, ...) are stored on
-- the row and maintained by application code / triggers. `workflow_json` and
-- `preview_graph_json` hold the declarative WorkflowGraph as jsonb — never code.
-- ----------------------------------------------------------------------------
create table if not exists public.workflow_templates (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles (id) on delete cascade,
  slug                 text not null unique
                         check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title                text not null check (char_length(title) between 1 and 120),
  short_description    text not null default '' check (char_length(short_description) <= 200),
  long_description     text not null default '',
  category_id          uuid not null references public.marketplace_categories (id),
  tags                 text[] not null default '{}',
  workflow_json        jsonb not null default '{"nodes": [], "edges": []}'::jsonb,
  preview_graph_json   jsonb,
  required_plugins     jsonb not null default '[]'::jsonb,
  declared_permissions text[] not null default '{}',
  risk_level           text not null default 'low'
                         check (risk_level in ('low', 'medium', 'high')),
  skill_level          text not null default 'beginner'
                         check (skill_level in ('beginner', 'intermediate', 'advanced')),
  visibility           text not null default 'private'
                         check (visibility in ('public', 'unlisted', 'private')),
  moderation_status    text not null default 'draft'
                         check (moderation_status in (
                           'draft', 'pending', 'approved', 'changes_requested',
                           'rejected', 'deprecated', 'removed')),
  pricing_model        text not null default 'free'
                         check (pricing_model in ('free', 'one_time', 'subscription', 'donation')),
  version              text not null default '1.0.0',
  copied_count         integer not null default 0 check (copied_count >= 0),
  like_count           integer not null default 0 check (like_count >= 0),
  bookmark_count       integer not null default 0 check (bookmark_count >= 0),
  rating_avg           numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count         integer not null default 0 check (rating_count >= 0),
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  is_demo              boolean not null default false
);

comment on table public.workflow_templates is
  'Declarative, copy-only workflow templates. workflow_json is JSON, never code.';

create index if not exists workflow_templates_owner_idx
  on public.workflow_templates (owner_id);
create index if not exists workflow_templates_category_idx
  on public.workflow_templates (category_id);
-- Drives the public gallery: only public + approved rows are listed.
create index if not exists workflow_templates_public_idx
  on public.workflow_templates (visibility, moderation_status, published_at desc);
create index if not exists workflow_templates_trending_idx
  on public.workflow_templates (copied_count desc, like_count desc);
create index if not exists workflow_templates_tags_idx
  on public.workflow_templates using gin (tags);

-- ----------------------------------------------------------------------------
-- workflow_template_versions  (interface WorkflowTemplateVersion)
-- ----------------------------------------------------------------------------
create table if not exists public.workflow_template_versions (
  id                   uuid primary key default gen_random_uuid(),
  workflow_template_id uuid not null
                         references public.workflow_templates (id) on delete cascade,
  version              text not null,
  workflow_json        jsonb not null default '{"nodes": [], "edges": []}'::jsonb,
  changelog            text not null default '',
  created_at           timestamptz not null default now(),
  unique (workflow_template_id, version)
);

comment on table public.workflow_template_versions is
  'Immutable version history for a workflow template.';

create index if not exists workflow_template_versions_template_idx
  on public.workflow_template_versions (workflow_template_id, created_at desc);

-- ----------------------------------------------------------------------------
-- plugin_listings  (interface PluginListing)
--
-- Metadata-only listings. No executable payload is stored or served.
-- ----------------------------------------------------------------------------
create table if not exists public.plugin_listings (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid not null references public.profiles (id) on delete cascade,
  slug                      text not null unique
                              check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name                      text not null check (char_length(name) between 1 and 120),
  icon_url                  text,
  short_description         text not null default '' check (char_length(short_description) <= 200),
  long_description          text not null default '',
  category_id               uuid not null references public.marketplace_categories (id),
  tags                      text[] not null default '{}',
  compatibility             text[] not null default '{}',
  required_apps             text[] not null default '{}',
  declared_permissions      text[] not null default '{}',
  cannot_access             text[] not null default '{}',
  installation_model        text not null default 'listing_only'
                              check (installation_model in (
                                'listing_only', 'native_builtin', 'signed_package_future')),
  installation_instructions text,
  source_url                text,
  documentation_url         text,
  support_url               text,
  screenshots               text[] not null default '{}',
  version                   text not null default '1.0.0',
  changelog                 text not null default '',
  trust_status              text not null default 'community'
                              check (trust_status in (
                                'official', 'verified', 'community', 'experimental',
                                'rejected', 'deprecated', 'coming_soon')),
  moderation_status         text not null default 'draft'
                              check (moderation_status in (
                                'draft', 'pending', 'approved', 'changes_requested',
                                'rejected', 'deprecated', 'removed')),
  pricing_model             text not null default 'free'
                              check (pricing_model in ('free', 'one_time', 'subscription', 'donation')),
  like_count                integer not null default 0 check (like_count >= 0),
  bookmark_count            integer not null default 0 check (bookmark_count >= 0),
  rating_avg                numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count              integer not null default 0 check (rating_count >= 0),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  is_demo                   boolean not null default false
);

comment on table public.plugin_listings is
  'Metadata-only plugin listings. No code/binaries are stored or distributed.';

create index if not exists plugin_listings_owner_idx
  on public.plugin_listings (owner_id);
create index if not exists plugin_listings_category_idx
  on public.plugin_listings (category_id);
create index if not exists plugin_listings_public_idx
  on public.plugin_listings (moderation_status, trust_status);
create index if not exists plugin_listings_tags_idx
  on public.plugin_listings using gin (tags);
create index if not exists plugin_listings_required_apps_idx
  on public.plugin_listings using gin (required_apps);

-- ----------------------------------------------------------------------------
-- plugin_listing_versions  (interface PluginListingVersion)
-- ----------------------------------------------------------------------------
create table if not exists public.plugin_listing_versions (
  id                 uuid primary key default gen_random_uuid(),
  plugin_listing_id  uuid not null
                       references public.plugin_listings (id) on delete cascade,
  version            text not null,
  changelog          text not null default '',
  listing_snapshot   jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  unique (plugin_listing_id, version)
);

comment on table public.plugin_listing_versions is
  'Immutable version history + metadata snapshot for a plugin listing.';

create index if not exists plugin_listing_versions_listing_idx
  on public.plugin_listing_versions (plugin_listing_id, created_at desc);

-- ----------------------------------------------------------------------------
-- marketplace_likes  (interface MarketplaceLike)
-- One like per (user, target). Polymorphic via target_type/target_id.
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

comment on table public.marketplace_likes is
  'A user liking a workflow/plugin/profile. Unique per (user, target).';

create index if not exists marketplace_likes_target_idx
  on public.marketplace_likes (target_type, target_id);

-- ----------------------------------------------------------------------------
-- marketplace_bookmarks  (interface MarketplaceBookmark)
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

comment on table public.marketplace_bookmarks is
  'A user bookmarking a workflow/plugin/profile. Private to the user.';

create index if not exists marketplace_bookmarks_user_idx
  on public.marketplace_bookmarks (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- marketplace_reviews  (interface MarketplaceReview)
-- One review per (user, target). rating 1..5.
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_reviews (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  target_type       text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id         uuid not null,
  rating            integer not null check (rating between 1 and 5),
  body              text not null default '' check (char_length(body) <= 4000),
  moderation_status text not null default 'visible'
                      check (moderation_status in ('visible', 'hidden', 'pending')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

comment on table public.marketplace_reviews is
  'One review/rating per user per target. moderation_status hides abusive text.';

create index if not exists marketplace_reviews_target_idx
  on public.marketplace_reviews (target_type, target_id, moderation_status);

-- ----------------------------------------------------------------------------
-- creator_follows  (interface CreatorFollow)
-- Composite PK (follower_id, creator_id) — no surrogate id in the type.
-- ----------------------------------------------------------------------------
create table if not exists public.creator_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  creator_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);

comment on table public.creator_follows is
  'Directed follow edge between two profiles.';

create index if not exists creator_follows_creator_idx
  on public.creator_follows (creator_id);

-- ----------------------------------------------------------------------------
-- marketplace_reports  (interface MarketplaceReport)
-- Submitted by users; triaged by moderators.
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  target_type  text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id    uuid not null,
  reason       text not null check (char_length(reason) between 1 and 200),
  details      text check (char_length(details) <= 4000),
  status       text not null default 'open'
                 check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  moderator_id uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

comment on table public.marketplace_reports is
  'Abuse/content reports. Visible only to the reporter and moderators (RLS).';

create index if not exists marketplace_reports_status_idx
  on public.marketplace_reports (status, created_at desc);
create index if not exists marketplace_reports_target_idx
  on public.marketplace_reports (target_type, target_id);
create index if not exists marketplace_reports_reporter_idx
  on public.marketplace_reports (reporter_id);

-- ----------------------------------------------------------------------------
-- moderation_actions  (interface ModerationAction)
-- Append-only audit log written only by moderators/admins.
-- ----------------------------------------------------------------------------
create table if not exists public.moderation_actions (
  id           uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles (id) on delete cascade,
  target_type  text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id    uuid not null,
  action       text not null check (char_length(action) between 1 and 80),
  reason       text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

comment on table public.moderation_actions is
  'Append-only audit trail of moderator decisions.';

create index if not exists moderation_actions_target_idx
  on public.moderation_actions (target_type, target_id, created_at desc);
create index if not exists moderation_actions_moderator_idx
  on public.moderation_actions (moderator_id, created_at desc);

-- ----------------------------------------------------------------------------
-- creator_payout_profiles  (interface CreatorPayoutProfile)
-- Stripe Connect onboarding state. The stripe_account_id is an opaque id, not
-- a secret key; secret keys never touch the database.
-- ----------------------------------------------------------------------------
create table if not exists public.creator_payout_profiles (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null unique
                      references public.profiles (id) on delete cascade,
  stripe_account_id text,
  onboarding_status text not null default 'not_started'
                      check (onboarding_status in ('not_started', 'pending', 'complete')),
  payouts_enabled   boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.creator_payout_profiles is
  'Per-creator Stripe Connect onboarding state. Holds an account id, no secrets.';

-- ----------------------------------------------------------------------------
-- marketplace_orders  (interface MarketplaceOrder)
-- amount/platform_fee_amount are integer minor units (cents).
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_orders (
  id                       uuid primary key default gen_random_uuid(),
  buyer_id                 uuid not null references public.profiles (id) on delete cascade,
  seller_id                uuid not null references public.profiles (id) on delete cascade,
  target_type              text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id                uuid not null,
  amount                   integer not null default 0 check (amount >= 0),
  currency                 text not null default 'usd' check (char_length(currency) = 3),
  platform_fee_amount      integer not null default 0 check (platform_fee_amount >= 0),
  stripe_payment_intent_id text,
  status                   text not null default 'pending'
                             check (status in ('pending', 'paid', 'failed', 'refunded', 'disputed')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.marketplace_orders is
  'Purchase records. amount + platform_fee_amount are integer minor units (cents).';

create index if not exists marketplace_orders_buyer_idx
  on public.marketplace_orders (buyer_id, created_at desc);
create index if not exists marketplace_orders_seller_idx
  on public.marketplace_orders (seller_id, created_at desc);
create unique index if not exists marketplace_orders_payment_intent_idx
  on public.marketplace_orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ----------------------------------------------------------------------------
-- marketplace_entitlements  (interface MarketplaceEntitlement)
-- What a user is allowed to access. One entitlement per (user, target).
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_entitlements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  target_type      text not null check (target_type in ('workflow', 'plugin', 'profile')),
  target_id        uuid not null,
  order_id         uuid references public.marketplace_orders (id) on delete set null,
  entitlement_type text not null default 'free'
                     check (entitlement_type in ('free', 'purchased', 'admin_granted')),
  created_at       timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

comment on table public.marketplace_entitlements is
  'Grants a user access to a target. Unique per (user, target).';

create index if not exists marketplace_entitlements_user_idx
  on public.marketplace_entitlements (user_id);
create index if not exists marketplace_entitlements_target_idx
  on public.marketplace_entitlements (target_type, target_id);
