-- ============================================================================
-- 0004_functions_triggers.sql — triggers, profile bootstrap, helper functions
--
-- Contents:
--   * touch_updated_at()        — generic updated_at maintenance trigger fn
--   * updated_at triggers       — attached to every table with an updated_at col
--   * handle_new_user()         — auto-creates a profile when an auth user appears
--   * generate_unique_handle()  — derives a unique handle from an email/local-part
--   * is_admin() / is_moderator() — re-declared idempotently (also in 0003)
--
-- All functions use `create or replace` and all triggers are dropped-then-
-- created so this migration is safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.touch_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at with the current time.';

-- Attach the trigger to each table that has an updated_at column.
do $$
declare
  tbl text;
  tables text[] := array[
    'profiles',
    'workflow_templates',
    'plugin_listings',
    'marketplace_reviews',
    'creator_payout_profiles',
    'marketplace_orders'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I;', tbl);
    execute format(
      'create trigger trg_touch_updated_at before update on public.%I
         for each row execute function public.touch_updated_at();',
      tbl
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Handle generation: turn an email local-part into a valid, unique handle.
-- Handles must match ^[a-z0-9][a-z0-9_]*$ and be 2..32 chars (see profiles
-- CHECK constraint). We sanitize, pad, then append a numeric suffix on collide.
-- ----------------------------------------------------------------------------
create or replace function public.generate_unique_handle(seed text)
returns citext
language plpgsql
security definer
set search_path = public
as $$
declare
  base       text;
  candidate  citext;
  suffix     integer := 0;
begin
  -- Lowercase, strip the domain, replace invalid chars with underscores.
  base := lower(coalesce(split_part(seed, '@', 1), ''));
  base := regexp_replace(base, '[^a-z0-9_]', '_', 'g');
  base := regexp_replace(base, '^[^a-z0-9]+', '', 'g'); -- must start alphanumeric
  if base is null or char_length(base) < 2 then
    base := 'user_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;
  base := substr(base, 1, 28); -- leave room for a numeric suffix

  candidate := base::citext;
  while exists (select 1 from public.profiles where handle = candidate) loop
    suffix := suffix + 1;
    candidate := (base || suffix::text)::citext;
  end loop;

  return candidate;
end;
$$;

comment on function public.generate_unique_handle(text) is
  'Derives a unique, constraint-valid profile handle from an email/seed string.';

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth.users row is inserted.
-- Runs as SECURITY DEFINER so it can write to public.profiles regardless of
-- the inserting context. Pulls display_name from user metadata when present.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_handle   citext;
  display      text;
begin
  new_handle := public.generate_unique_handle(coalesce(new.email, new.id::text));

  display := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    new_handle::text
  );

  insert into public.profiles (id, handle, display_name)
  values (new.id, new_handle, left(display, 80))
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'AFTER INSERT on auth.users: creates the matching public.profiles row.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Privilege helpers — re-created idempotently (also defined in 0003_rls.sql so
-- the policies could reference them). Keeping a copy here documents them with
-- the rest of the function layer and makes 0004 self-consistent.
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

revoke all on function public.is_admin() from public;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_moderator() to authenticated;

-- ----------------------------------------------------------------------------
-- Count maintenance (optional, documented for later wiring)
--
-- The denormalized counters on workflow_templates / plugin_listings
-- (like_count, bookmark_count, copied_count, rating_avg, rating_count) are
-- intentionally maintained by application code today so the demo path (which
-- never touches Postgres) and the Supabase path stay in sync.
--
-- If you later want the database to own these counts, add AFTER INSERT/DELETE
-- triggers on marketplace_likes / marketplace_bookmarks / marketplace_reviews
-- that recompute the matching column for the affected (target_type, target_id).
-- Such triggers must branch on target_type and update the correct parent table.
-- They are left out here to avoid double-counting against the app-side logic.
-- ----------------------------------------------------------------------------
