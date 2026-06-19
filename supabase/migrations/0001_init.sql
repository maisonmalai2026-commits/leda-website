-- ============================================================================
-- 0001_init.sql — Leda Marketplace base schema
--
-- Enables the extensions we rely on, then creates the foundational tables:
--   * profiles              (1:1 with auth.users)
--   * marketplace_categories
--
-- Column names mirror the TypeScript domain types in
-- lib/marketplace/types.ts EXACTLY so the Supabase provider can map 1:1.
--
-- This migration is safe to run on a fresh Supabase project. Later migrations
-- (0002_marketplace, 0003_rls, 0004_functions_triggers) build on top of it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
-- pgcrypto provides gen_random_uuid() used as the default for every PK.
create extension if not exists pgcrypto;
-- citext lets us store case-insensitive unique handles (e.g. "Leda" == "leda").
create extension if not exists citext;

-- ----------------------------------------------------------------------------
-- profiles
--
-- One row per authenticated user. Created automatically by the trigger in
-- 0004_functions_triggers.sql when a new auth.users row appears.
-- Mirrors the `Profile` interface (minus the derived/aggregate fields, which
-- the provider computes at read time).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  handle              citext not null unique
                        check (char_length(handle) between 2 and 32
                               and handle ~ '^[a-z0-9][a-z0-9_]*$'),
  display_name        text not null default '' check (char_length(display_name) <= 80),
  bio                 text check (char_length(bio) <= 2000),
  avatar_url          text,
  website_url         text,
  profile_visibility  text not null default 'public'
                        check (profile_visibility in ('public', 'private')),
  role                text not null default 'user'
                        check (role in ('user', 'creator', 'moderator', 'admin')),
  creator_status      text not null default 'none'
                        check (creator_status in ('none', 'active', 'suspended')),
  is_verified_creator boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is
  'Public-facing user profile, 1:1 with auth.users. Never exposes auth email.';

create index if not exists profiles_role_idx
  on public.profiles (role);
create index if not exists profiles_visibility_idx
  on public.profiles (profile_visibility);
create index if not exists profiles_creator_status_idx
  on public.profiles (creator_status);

-- ----------------------------------------------------------------------------
-- marketplace_categories
--
-- Mirrors the `MarketplaceCategory` interface. Categories are shared between
-- workflow templates and plugin listings via the `type` column.
-- ----------------------------------------------------------------------------
create table if not exists public.marketplace_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique
                check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  type        text not null default 'both'
                check (type in ('workflow', 'plugin', 'both')),
  sort_order  integer not null default 0,
  active      boolean not null default true
);

comment on table public.marketplace_categories is
  'Browsable categories for workflows and plugins. Curated, not user-created.';

create index if not exists marketplace_categories_active_sort_idx
  on public.marketplace_categories (active, sort_order);
create index if not exists marketplace_categories_type_idx
  on public.marketplace_categories (type);
