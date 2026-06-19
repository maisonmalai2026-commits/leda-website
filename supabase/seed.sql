-- ============================================================================
-- seed.sql — minimal seed data for a CONFIGURED Supabase instance
--
-- IMPORTANT: The marketplace's local demo browsing (when no Supabase env is
-- set) reads from a JSON seed file in the app, NOT from this SQL. This file is
-- only relevant when you have a real Supabase project and want a few starter
-- categories (and optionally some demo content) in the database.
--
-- Run with:  supabase db reset      (re-runs migrations then this seed), or
--            paste into the SQL editor after running 0001..0004.
--
-- This script is idempotent: categories upsert on their unique slug, so it is
-- safe to run more than once.
--
-- HONESTY NOTE: every example row below sets is_demo = true and uses obviously
-- non-real content. There are NO fabricated user counts, reviews, downloads,
-- revenue, testimonials, or partnerships anywhere in this seed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Categories (real, curated browse facets — these are not "demo" content).
-- ----------------------------------------------------------------------------
insert into public.marketplace_categories (name, slug, description, type, sort_order, active)
values
  ('Productivity',     'productivity',     'Save time on everyday tasks.',                 'both',     10, true),
  ('Research',         'research',          'Gather, summarize, and compare information.',  'workflow', 20, true),
  ('Communication',    'communication',    'Email, chat, and messaging helpers.',          'both',     30, true),
  ('Data & Files',     'data-and-files',    'Organize, transform, and move files.',         'both',     40, true),
  ('Developer Tools',  'developer-tools',   'Utilities for building and shipping software.','plugin',   50, true),
  ('Browser & Web',    'browser-and-web',   'Automate browsing and web interactions.',      'both',     60, true)
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      type        = excluded.type,
      sort_order  = excluded.sort_order,
      active      = excluded.active;

-- ----------------------------------------------------------------------------
-- Example demo content (COMMENTED OUT)
--
-- The rows below illustrate the exact shape of a demo workflow template and a
-- demo plugin listing. They are commented out because they require a real
-- owner profile (a row in public.profiles, created when an auth user signs up).
--
-- To use them on a configured instance:
--   1. Sign up a user via Supabase Auth (creates a profiles row automatically).
--   2. Replace <DEMO_OWNER_UUID> below with that profile's id.
--   3. Uncomment and run.
--
-- Every example sets is_demo = true and moderation_status = 'approved' so it is
-- visibly labeled "Demo" in the UI and appears in the public gallery.
-- ----------------------------------------------------------------------------

-- -- A safe, declarative demo workflow (nodes limited to the allowed types).
-- insert into public.workflow_templates (
--   owner_id, slug, title, short_description, long_description, category_id,
--   tags, workflow_json, required_plugins, declared_permissions,
--   risk_level, skill_level, visibility, moderation_status, pricing_model,
--   version, published_at, is_demo
-- )
-- values (
--   '<DEMO_OWNER_UUID>',
--   'demo-daily-briefing',
--   'Demo: Daily Briefing',
--   'A sample workflow that drafts a short daily summary.',
--   'This is demo content used to illustrate the workflow gallery. It performs '
--     || 'no real actions and is clearly labeled as a demo.',
--   (select id from public.marketplace_categories where slug = 'productivity'),
--   array['demo', 'summary'],
--   jsonb_build_object(
--     'nodes', jsonb_build_array(
--       jsonb_build_object('id', 'n1', 'type', 'manual_trigger', 'label', 'Start'),
--       jsonb_build_object('id', 'n2', 'type', 'main_brain',     'label', 'Draft summary'),
--       jsonb_build_object('id', 'n3', 'type', 'notify_user',    'label', 'Show me'),
--       jsonb_build_object('id', 'n4', 'type', 'end',            'label', 'Done')
--     ),
--     'edges', jsonb_build_array(
--       jsonb_build_object('id', 'e1', 'source', 'n1', 'target', 'n2'),
--       jsonb_build_object('id', 'e2', 'source', 'n2', 'target', 'n3'),
--       jsonb_build_object('id', 'e3', 'source', 'n3', 'target', 'n4')
--     )
--   ),
--   '[]'::jsonb,
--   array[]::text[],
--   'low', 'beginner', 'public', 'approved', 'free',
--   '1.0.0', now(), true
-- );

-- -- A metadata-only demo plugin listing.
-- insert into public.plugin_listings (
--   owner_id, slug, name, short_description, long_description, category_id,
--   tags, compatibility, required_apps, declared_permissions, cannot_access,
--   installation_model, version, trust_status, moderation_status, pricing_model,
--   is_demo
-- )
-- values (
--   '<DEMO_OWNER_UUID>',
--   'demo-notes-connector',
--   'Demo: Notes Connector',
--   'A sample listing illustrating the plugin detail page.',
--   'This is demo content. It is metadata only and ships no executable code.',
--   (select id from public.marketplace_categories where slug = 'productivity'),
--   array['demo'],
--   array['desktop'],
--   array['Notes'],
--   array['read_notes'],
--   array['network', 'filesystem_outside_notes'],
--   'listing_only', '1.0.0', 'community', 'approved', 'free',
--   true
-- );
