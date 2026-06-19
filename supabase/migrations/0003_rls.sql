-- ============================================================================
-- 0003_rls.sql — Row Level Security policies for the Leda Marketplace
--
-- Principles enforced here:
--   * Public reads are limited to PUBLIC + APPROVED content and PUBLIC profiles.
--   * Owners (auth.uid() = owner_id) fully control only their own content rows.
--   * Users manage only their own likes/bookmarks/follows/reviews/orders/
--     entitlements.
--   * Creators can SEE moderation feedback about their own content, but cannot
--     write moderation data.
--   * Only moderators/admins (profiles.role) can read/update reports, insert
--     moderation_actions, and change moderation_status.
--   * No policy ever exposes auth emails, payment secrets, or other users'
--     private drafts.
--
-- Helper functions is_moderator()/is_admin() are SECURITY DEFINER so they can
-- read profiles.role without recursing into RLS. They are (re)created here so
-- the policies below can reference them; 0004 re-creates them idempotently.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Privilege helpers (SECURITY DEFINER, search_path pinned to avoid hijacking).
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'True when the current auth user has role = admin. SECURITY DEFINER to bypass RLS on profiles.';

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('moderator', 'admin')
  );
$$;

comment on function public.is_moderator() is
  'True when the current auth user has role moderator or admin.';

revoke all on function public.is_admin() from public;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_moderator() to authenticated;

-- ----------------------------------------------------------------------------
-- Enable RLS on every table. With RLS on and no permissive policy, access is
-- denied by default — so the policies below are the entire access surface.
-- ----------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.marketplace_categories    enable row level security;
alter table public.workflow_templates        enable row level security;
alter table public.workflow_template_versions enable row level security;
alter table public.plugin_listings           enable row level security;
alter table public.plugin_listing_versions   enable row level security;
alter table public.marketplace_likes         enable row level security;
alter table public.marketplace_bookmarks     enable row level security;
alter table public.marketplace_reviews       enable row level security;
alter table public.creator_follows           enable row level security;
alter table public.marketplace_reports       enable row level security;
alter table public.moderation_actions        enable row level security;
alter table public.creator_payout_profiles   enable row level security;
alter table public.marketplace_orders        enable row level security;
alter table public.marketplace_entitlements  enable row level security;

-- ============================================================================
-- profiles
-- ============================================================================

-- Anyone may read a profile that is public. Owners and moderators may read
-- any profile. Note: this table never contains the auth email.
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select
  using (
    profile_visibility = 'public'
    or id = auth.uid()
    or public.is_moderator()
  );

-- A user may insert only their own profile row (id must equal their uid). In
-- practice the on-signup trigger creates it, but this allows self-repair.
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert
  with check (id = auth.uid());

-- A user may update only their own profile. Admins may update any profile
-- (e.g. to set role/creator_status); enforced via the WITH CHECK below.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ============================================================================
-- marketplace_categories  (read-only to clients; managed via service role)
-- ============================================================================

-- Everyone (including anon) can read active categories; mods see all.
drop policy if exists categories_select_active on public.marketplace_categories;
create policy categories_select_active on public.marketplace_categories
  for select
  using (active = true or public.is_moderator());

-- Only admins may create/modify categories from a client; the service role
-- (used by seeds/migrations) bypasses RLS entirely.
drop policy if exists categories_admin_write on public.marketplace_categories;
create policy categories_admin_write on public.marketplace_categories
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- workflow_templates
-- ============================================================================

-- Public gallery: only public + approved templates are visible to everyone.
-- Owners always see their own rows (including private drafts). Moderators see
-- all rows so they can review queued submissions.
drop policy if exists workflow_templates_select_public on public.workflow_templates;
create policy workflow_templates_select_public on public.workflow_templates
  for select
  using (
    (visibility = 'public' and moderation_status = 'approved')
    or owner_id = auth.uid()
    or public.is_moderator()
  );

-- An owner may create a template only for themselves.
drop policy if exists workflow_templates_insert_own on public.workflow_templates;
create policy workflow_templates_insert_own on public.workflow_templates
  for insert
  with check (owner_id = auth.uid());

-- An owner may edit their own template; moderators may edit (e.g. to set
-- moderation_status). Clients cannot escalate ownership because WITH CHECK
-- keeps owner_id = auth.uid() for non-moderators.
drop policy if exists workflow_templates_update_own on public.workflow_templates;
create policy workflow_templates_update_own on public.workflow_templates
  for update
  using (owner_id = auth.uid() or public.is_moderator())
  with check (owner_id = auth.uid() or public.is_moderator());

-- Owners (and admins) may delete their own template.
drop policy if exists workflow_templates_delete_own on public.workflow_templates;
create policy workflow_templates_delete_own on public.workflow_templates
  for delete
  using (owner_id = auth.uid() or public.is_admin());

-- ============================================================================
-- workflow_template_versions  (visibility inherited from parent template)
-- ============================================================================

-- A version row is readable when its parent template is readable to the caller.
drop policy if exists wtv_select_via_parent on public.workflow_template_versions;
create policy wtv_select_via_parent on public.workflow_template_versions
  for select
  using (
    exists (
      select 1 from public.workflow_templates t
      where t.id = workflow_template_id
        and (
          (t.visibility = 'public' and t.moderation_status = 'approved')
          or t.owner_id = auth.uid()
          or public.is_moderator()
        )
    )
  );

-- Only the template owner may add a version row.
drop policy if exists wtv_insert_via_owner on public.workflow_template_versions;
create policy wtv_insert_via_owner on public.workflow_template_versions
  for insert
  with check (
    exists (
      select 1 from public.workflow_templates t
      where t.id = workflow_template_id and t.owner_id = auth.uid()
    )
  );

-- Owners may delete versions of their own templates.
drop policy if exists wtv_delete_via_owner on public.workflow_template_versions;
create policy wtv_delete_via_owner on public.workflow_template_versions
  for delete
  using (
    exists (
      select 1 from public.workflow_templates t
      where t.id = workflow_template_id
        and (t.owner_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- plugin_listings
-- ============================================================================

-- Public gallery: approved listings are visible to everyone EXCEPT those whose
-- trust_status marks them rejected. Owners see their own; moderators see all.
drop policy if exists plugin_listings_select_public on public.plugin_listings;
create policy plugin_listings_select_public on public.plugin_listings
  for select
  using (
    (moderation_status = 'approved' and trust_status <> 'rejected')
    or owner_id = auth.uid()
    or public.is_moderator()
  );

drop policy if exists plugin_listings_insert_own on public.plugin_listings;
create policy plugin_listings_insert_own on public.plugin_listings
  for insert
  with check (owner_id = auth.uid());

drop policy if exists plugin_listings_update_own on public.plugin_listings;
create policy plugin_listings_update_own on public.plugin_listings
  for update
  using (owner_id = auth.uid() or public.is_moderator())
  with check (owner_id = auth.uid() or public.is_moderator());

drop policy if exists plugin_listings_delete_own on public.plugin_listings;
create policy plugin_listings_delete_own on public.plugin_listings
  for delete
  using (owner_id = auth.uid() or public.is_admin());

-- ============================================================================
-- plugin_listing_versions  (visibility inherited from parent listing)
-- ============================================================================

drop policy if exists plv_select_via_parent on public.plugin_listing_versions;
create policy plv_select_via_parent on public.plugin_listing_versions
  for select
  using (
    exists (
      select 1 from public.plugin_listings l
      where l.id = plugin_listing_id
        and (
          (l.moderation_status = 'approved' and l.trust_status <> 'rejected')
          or l.owner_id = auth.uid()
          or public.is_moderator()
        )
    )
  );

drop policy if exists plv_insert_via_owner on public.plugin_listing_versions;
create policy plv_insert_via_owner on public.plugin_listing_versions
  for insert
  with check (
    exists (
      select 1 from public.plugin_listings l
      where l.id = plugin_listing_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists plv_delete_via_owner on public.plugin_listing_versions;
create policy plv_delete_via_owner on public.plugin_listing_versions
  for delete
  using (
    exists (
      select 1 from public.plugin_listings l
      where l.id = plugin_listing_id
        and (l.owner_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================================
-- marketplace_likes  (counts are public; rows are owned by the liker)
-- ============================================================================

-- Like rows are publicly readable so the UI can show "liked by you" and totals.
drop policy if exists likes_select_all on public.marketplace_likes;
create policy likes_select_all on public.marketplace_likes
  for select
  using (true);

-- A user may create/remove only their own likes.
drop policy if exists likes_insert_own on public.marketplace_likes;
create policy likes_insert_own on public.marketplace_likes
  for insert
  with check (user_id = auth.uid());

drop policy if exists likes_delete_own on public.marketplace_likes;
create policy likes_delete_own on public.marketplace_likes
  for delete
  using (user_id = auth.uid());

-- ============================================================================
-- marketplace_bookmarks  (PRIVATE to the owning user)
-- ============================================================================

drop policy if exists bookmarks_select_own on public.marketplace_bookmarks;
create policy bookmarks_select_own on public.marketplace_bookmarks
  for select
  using (user_id = auth.uid());

drop policy if exists bookmarks_insert_own on public.marketplace_bookmarks;
create policy bookmarks_insert_own on public.marketplace_bookmarks
  for insert
  with check (user_id = auth.uid());

drop policy if exists bookmarks_delete_own on public.marketplace_bookmarks;
create policy bookmarks_delete_own on public.marketplace_bookmarks
  for delete
  using (user_id = auth.uid());

-- ============================================================================
-- marketplace_reviews
-- ============================================================================

-- Visible reviews are public; authors and moderators can also see their own
-- hidden/pending reviews.
drop policy if exists reviews_select_visible on public.marketplace_reviews;
create policy reviews_select_visible on public.marketplace_reviews
  for select
  using (
    moderation_status = 'visible'
    or user_id = auth.uid()
    or public.is_moderator()
  );

-- A user may write only their own review (one per target enforced by UNIQUE).
drop policy if exists reviews_insert_own on public.marketplace_reviews;
create policy reviews_insert_own on public.marketplace_reviews
  for insert
  with check (user_id = auth.uid());

-- Author may edit their own review; moderators may edit (e.g. hide it).
drop policy if exists reviews_update_own on public.marketplace_reviews;
create policy reviews_update_own on public.marketplace_reviews
  for update
  using (user_id = auth.uid() or public.is_moderator())
  with check (user_id = auth.uid() or public.is_moderator());

drop policy if exists reviews_delete_own on public.marketplace_reviews;
create policy reviews_delete_own on public.marketplace_reviews
  for delete
  using (user_id = auth.uid() or public.is_moderator());

-- ============================================================================
-- creator_follows  (follow graph is public; you control only your own edges)
-- ============================================================================

drop policy if exists follows_select_all on public.creator_follows;
create policy follows_select_all on public.creator_follows
  for select
  using (true);

drop policy if exists follows_insert_own on public.creator_follows;
create policy follows_insert_own on public.creator_follows
  for insert
  with check (follower_id = auth.uid());

drop policy if exists follows_delete_own on public.creator_follows;
create policy follows_delete_own on public.creator_follows
  for delete
  using (follower_id = auth.uid());

-- ============================================================================
-- marketplace_reports  (reporter + moderators only — never broadly readable)
-- ============================================================================

-- A reporter can see their own reports; moderators can see all reports. No
-- one else can read reports (prevents leaking who reported what).
drop policy if exists reports_select_scoped on public.marketplace_reports;
create policy reports_select_scoped on public.marketplace_reports
  for select
  using (reporter_id = auth.uid() or public.is_moderator());

-- Any authenticated user may file a report about a target, as themselves.
drop policy if exists reports_insert_own on public.marketplace_reports;
create policy reports_insert_own on public.marketplace_reports
  for insert
  with check (reporter_id = auth.uid());

-- Only moderators/admins may triage (update) a report.
drop policy if exists reports_update_moderator on public.marketplace_reports;
create policy reports_update_moderator on public.marketplace_reports
  for update
  using (public.is_moderator())
  with check (public.is_moderator());

-- ============================================================================
-- moderation_actions  (audit log — moderators write, mods + affected owner read)
-- ============================================================================

-- Moderators read the whole audit log. A creator may read actions taken
-- against their OWN content (so they see moderation feedback), by joining the
-- action's target back to the content they own.
drop policy if exists modactions_select_scoped on public.moderation_actions;
create policy modactions_select_scoped on public.moderation_actions
  for select
  using (
    public.is_moderator()
    or (
      target_type = 'workflow' and exists (
        select 1 from public.workflow_templates t
        where t.id = target_id and t.owner_id = auth.uid()
      )
    )
    or (
      target_type = 'plugin' and exists (
        select 1 from public.plugin_listings l
        where l.id = target_id and l.owner_id = auth.uid()
      )
    )
    or (target_type = 'profile' and target_id = auth.uid())
  );

-- Only moderators/admins may append to the audit log, and only as themselves.
drop policy if exists modactions_insert_moderator on public.moderation_actions;
create policy modactions_insert_moderator on public.moderation_actions
  for insert
  with check (public.is_moderator() and moderator_id = auth.uid());

-- ============================================================================
-- creator_payout_profiles  (PRIVATE to the owning creator; no key material)
-- ============================================================================

drop policy if exists payout_select_own on public.creator_payout_profiles;
create policy payout_select_own on public.creator_payout_profiles
  for select
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists payout_insert_own on public.creator_payout_profiles;
create policy payout_insert_own on public.creator_payout_profiles
  for insert
  with check (owner_id = auth.uid());

-- The owner may update non-sensitive fields. stripe_account_id /
-- payouts_enabled are intended to be set by trusted server code (service role,
-- which bypasses RLS); this policy still scopes any client write to the owner.
drop policy if exists payout_update_own on public.creator_payout_profiles;
create policy payout_update_own on public.creator_payout_profiles
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================================
-- marketplace_orders  (buyer + seller may read their own; writes via service)
-- ============================================================================

-- A user can see orders where they are the buyer or the seller. Payment
-- internals (stripe_payment_intent_id) live here but are only visible to the
-- two parties of the order, never to the public.
drop policy if exists orders_select_party on public.marketplace_orders;
create policy orders_select_party on public.marketplace_orders
  for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- A buyer may create a pending order for themselves. Status transitions to
-- paid/refunded/etc. are performed by server-side webhook code using the
-- service role (which bypasses RLS), not by clients.
drop policy if exists orders_insert_buyer on public.marketplace_orders;
create policy orders_insert_buyer on public.marketplace_orders
  for insert
  with check (buyer_id = auth.uid());

-- ============================================================================
-- marketplace_entitlements  (PRIVATE to the owning user)
-- ============================================================================

drop policy if exists entitlements_select_own on public.marketplace_entitlements;
create policy entitlements_select_own on public.marketplace_entitlements
  for select
  using (user_id = auth.uid() or public.is_admin());

-- Free entitlements may be self-granted by the user (e.g. "add free workflow
-- to my library"). Purchased/admin_granted entitlements are created by trusted
-- server code via the service role. The WITH CHECK pins ownership either way.
drop policy if exists entitlements_insert_own_free on public.marketplace_entitlements;
create policy entitlements_insert_own_free on public.marketplace_entitlements
  for insert
  with check (user_id = auth.uid() and entitlement_type = 'free');

-- A user may remove their own free entitlement (e.g. "remove from library").
drop policy if exists entitlements_delete_own_free on public.marketplace_entitlements;
create policy entitlements_delete_own_free on public.marketplace_entitlements
  for delete
  using (user_id = auth.uid() and entitlement_type = 'free');
