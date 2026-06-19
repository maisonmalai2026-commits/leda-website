// ============================================================================
// Async data facade for the Leda Marketplace.
//
// Every page and server component reads marketplace data through this module
// rather than touching seed JSON or Supabase directly. That indirection lets
// Supabase slot in later without changing any caller: each function has a
// clearly-marked "// TODO(supabase)" branch that, once implemented, replaces
// the demo/seed path.
//
// Demo mode (no Supabase env) is the default and is fully functional: reads
// come from the seed content under content/marketplace/*.
//
// SECURITY INVARIANT (public reads):
//   The public list/get functions exclude any item whose
//     visibility !== "public"  OR  moderation_status !== "approved".
//   The only exception is an owner viewing their own non-public content, which
//   requires opts.includeNonPublic === true AND opts.viewerId === item.owner_id.
//   This is implemented as the default below (see isPubliclyVisible* helpers)
//   and applied before any item is returned.
//
// This module is client-safe: it imports only types, config flags, and seed
// data. The Supabase branches will live behind isSupabaseConfigured() and use
// the public anon client (RLS-protected), never server-only secrets.
// ============================================================================

import { isSupabaseConfigured } from "@/lib/marketplace/config";
import type {
  MarketplaceCategory,
  MarketplaceReview,
  PluginFilter,
  PluginListing,
  PluginSort,
  Profile,
  TargetType,
  WorkflowFilter,
  WorkflowSort,
  WorkflowTemplate,
} from "@/lib/marketplace/types";
import {
  getSeedCategory,
  getSeedProfile,
  seedCategories,
  seedPlugins,
  seedProfiles,
  seedReviews,
  seedWorkflows,
} from "@/lib/marketplace/seed";

// ---------------------------------------------------------------------------
// Read options shared by get-by-slug functions.
// ---------------------------------------------------------------------------

export interface GetContentOptions {
  /** Allow non-public/non-approved content through (owner preview only). */
  includeNonPublic?: boolean;
  /** Id of the viewer; must equal owner_id for includeNonPublic to apply. */
  viewerId?: string;
}

// ---------------------------------------------------------------------------
// Security: public-visibility predicates (the default gate for all reads).
// ---------------------------------------------------------------------------

/**
 * A workflow is publicly visible only when it is public + approved. An owner
 * previewing their own content may bypass this via opts (includeNonPublic +
 * matching viewerId).
 */
function isWorkflowVisible(
  item: WorkflowTemplate,
  opts?: GetContentOptions,
): boolean {
  if (
    opts?.includeNonPublic &&
    opts.viewerId &&
    opts.viewerId === item.owner_id
  ) {
    return true;
  }
  return item.visibility === "public" && item.moderation_status === "approved";
}

/**
 * A plugin listing has no per-item "visibility" column, so public visibility is
 * driven by moderation_status === "approved". An owner may preview their own
 * non-approved listing via opts.
 */
function isPluginVisible(
  item: PluginListing,
  opts?: GetContentOptions,
): boolean {
  if (
    opts?.includeNonPublic &&
    opts.viewerId &&
    opts.viewerId === item.owner_id
  ) {
    return true;
  }
  return item.moderation_status === "approved";
}

// ---------------------------------------------------------------------------
// Hydration: attach owner + category relations to returned items.
// ---------------------------------------------------------------------------

function hydrateWorkflow(item: WorkflowTemplate): WorkflowTemplate {
  return {
    ...item,
    owner: getSeedProfile(item.owner_id) ?? item.owner,
    category: getSeedCategory(item.category_id) ?? item.category,
  };
}

function hydratePlugin(item: PluginListing): PluginListing {
  return {
    ...item,
    owner: getSeedProfile(item.owner_id) ?? item.owner,
    category: getSeedCategory(item.category_id) ?? item.category,
  };
}

function hydrateReview(item: MarketplaceReview): MarketplaceReview {
  const profile = getSeedProfile(item.user_id);
  return {
    ...item,
    author: profile
      ? {
          id: profile.id,
          handle: profile.handle,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        }
      : item.author,
  };
}

// ---------------------------------------------------------------------------
// Pure, testable filter + sort helpers (no I/O, no env).
// ---------------------------------------------------------------------------

/** True when any node in the graph is a schedule trigger. */
function hasScheduleTrigger(item: WorkflowTemplate): boolean {
  return item.workflow_json.nodes.some(
    (node) => node.type === "schedule_trigger",
  );
}

/** True when any node in the graph is a manual trigger. */
function hasManualTrigger(item: WorkflowTemplate): boolean {
  return item.workflow_json.nodes.some(
    (node) => node.type === "manual_trigger",
  );
}

/**
 * Apply a WorkflowFilter to a list of workflows. Pure: returns a new array and
 * does not sort. Category/tag/tool comparisons are case-insensitive where it
 * helps, slug/id-aware where it matters.
 */
export function applyWorkflowFilter(
  items: WorkflowTemplate[],
  filter?: WorkflowFilter,
): WorkflowTemplate[] {
  if (!filter) return [...items];

  const query = filter.query?.trim().toLowerCase();
  const tag = filter.tag?.trim().toLowerCase();
  const tool = filter.tool?.trim().toLowerCase();

  return items.filter((item) => {
    if (query) {
      const haystack = [
        item.title,
        item.short_description,
        item.long_description,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filter.category) {
      // Match by category id or category slug.
      const category = getSeedCategory(item.category_id);
      const matches =
        item.category_id === filter.category ||
        category?.slug === filter.category;
      if (!matches) return false;
    }

    if (tag) {
      if (!item.tags.some((t) => t.toLowerCase() === tag)) return false;
    }

    if (tool) {
      const matches = item.required_plugins.some(
        (plugin) =>
          plugin.slug.toLowerCase() === tool ||
          plugin.name.toLowerCase() === tool,
      );
      if (!matches) return false;
    }

    if (filter.skill_level && item.skill_level !== filter.skill_level) {
      return false;
    }

    if (filter.risk_level && item.risk_level !== filter.risk_level) {
      return false;
    }

    if (filter.trigger === "scheduled" && !hasScheduleTrigger(item)) {
      return false;
    }
    if (filter.trigger === "manual" && !hasManualTrigger(item)) {
      return false;
    }

    if (filter.pricing && item.pricing_model !== filter.pricing) {
      return false;
    }

    return true;
  });
}

/**
 * Apply a PluginFilter to a list of plugins. Pure: returns a new array and does
 * not sort.
 */
export function applyPluginFilter(
  items: PluginListing[],
  filter?: PluginFilter,
): PluginListing[] {
  if (!filter) return [...items];

  const query = filter.query?.trim().toLowerCase();
  const requiredApp = filter.required_app?.trim().toLowerCase();

  return items.filter((item) => {
    if (query) {
      const haystack = [
        item.name,
        item.short_description,
        item.long_description,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filter.category) {
      const category = getSeedCategory(item.category_id);
      const matches =
        item.category_id === filter.category ||
        category?.slug === filter.category;
      if (!matches) return false;
    }

    if (filter.trust_status && item.trust_status !== filter.trust_status) {
      return false;
    }

    if (requiredApp) {
      if (!item.required_apps.some((app) => app.toLowerCase() === requiredApp)) {
        return false;
      }
    }

    if (filter.pricing && item.pricing_model !== filter.pricing) {
      return false;
    }

    return true;
  });
}

function compareNewest(a: string | null, b: string | null): number {
  const at = a ? Date.parse(a) : 0;
  const bt = b ? Date.parse(b) : 0;
  return bt - at;
}

/**
 * Sort workflows by the requested order. Pure: returns a new array. "trending"
 * is a blend of likes + recent copies; "editors_picks" favors official/verified
 * owners then rating.
 */
export function sortWorkflows(
  items: WorkflowTemplate[],
  sort?: WorkflowSort,
): WorkflowTemplate[] {
  const list = [...items];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => compareNewest(a.published_at, b.published_at));
    case "most_copied":
      return list.sort((a, b) => b.copied_count - a.copied_count);
    case "highest_rated":
      return list.sort(
        (a, b) =>
          b.rating_avg - a.rating_avg || b.rating_count - a.rating_count,
      );
    case "editors_picks":
      return list.sort((a, b) => {
        const av = getSeedProfile(a.owner_id)?.is_verified_creator ? 1 : 0;
        const bv = getSeedProfile(b.owner_id)?.is_verified_creator ? 1 : 0;
        return bv - av || b.rating_avg - a.rating_avg;
      });
    case "trending":
    default:
      return list.sort(
        (a, b) =>
          b.like_count + b.copied_count - (a.like_count + a.copied_count),
      );
  }
}

/** Sort plugins by the requested order. Pure: returns a new array. */
export function sortPlugins(
  items: PluginListing[],
  sort?: PluginSort,
): PluginListing[] {
  const list = [...items];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => compareNewest(a.created_at, b.created_at));
    case "highest_rated":
      return list.sort(
        (a, b) =>
          b.rating_avg - a.rating_avg || b.rating_count - a.rating_count,
      );
    case "editors_picks":
      return list.sort((a, b) => {
        const rank = (p: PluginListing) =>
          p.trust_status === "official" ? 2 : p.trust_status === "verified" ? 1 : 0;
        return rank(b) - rank(a) || b.rating_avg - a.rating_avg;
      });
    case "trending":
    default:
      return list.sort(
        (a, b) =>
          b.like_count + b.bookmark_count - (a.like_count + a.bookmark_count),
      );
  }
}

// ---------------------------------------------------------------------------
// Creator aggregates (computed from seed in demo mode).
// ---------------------------------------------------------------------------

/**
 * Compute the read-only aggregate counts surfaced on a profile. In demo mode
 * these are derived from seed content so they are honest, not invented:
 *   - public_workflow_count / public_plugin_count: count of the creator's
 *     publicly-visible content.
 *   - total_likes: sum of like_count across that public content.
 *   - follower_count: not modeled in seed, so it is 0 (no fake followers).
 */
function withCreatorAggregates(profile: Profile): Profile {
  const workflows = seedWorkflows.filter(
    (w) => w.owner_id === profile.id && isWorkflowVisible(w),
  );
  const plugins = seedPlugins.filter(
    (p) => p.owner_id === profile.id && isPluginVisible(p),
  );
  const total_likes =
    workflows.reduce((sum, w) => sum + w.like_count, 0) +
    plugins.reduce((sum, p) => sum + p.like_count, 0);

  return {
    ...profile,
    public_workflow_count: workflows.length,
    public_plugin_count: plugins.length,
    total_likes,
    // No follower relationships exist in seed — do not fabricate a count.
    follower_count: 0,
  };
}

// ---------------------------------------------------------------------------
// Async facade — workflows.
// ---------------------------------------------------------------------------

/** List publicly-visible workflows, filtered + sorted. */
export async function listWorkflows(
  filter?: WorkflowFilter,
): Promise<WorkflowTemplate[]> {
  // TODO(supabase): query workflow_templates with RLS when isSupabaseConfigured()
  // (where visibility='public' and moderation_status='approved'), translating
  // `filter` into SQL. Until then, fall back to seed.
  if (isSupabaseConfigured()) {
    // Falls through to seed for now — Supabase wiring lands in a later task.
  }

  // SECURITY: gate to publicly-visible content before anything else.
  const visible = seedWorkflows.filter((w) => isWorkflowVisible(w));
  const filtered = applyWorkflowFilter(visible, filter);
  const sorted = sortWorkflows(filtered, filter?.sort);
  return sorted.map(hydrateWorkflow);
}

/**
 * Get a single workflow by slug. Returns null when not found or when the viewer
 * is not allowed to see it (security invariant). Owners may preview their own
 * non-public content via opts.
 */
export async function getWorkflowBySlug(
  slug: string,
  opts?: GetContentOptions,
): Promise<WorkflowTemplate | null> {
  // TODO(supabase): select workflow_templates where slug=? with RLS when
  // isSupabaseConfigured(). Falls back to seed for now.
  const item = seedWorkflows.find((w) => w.slug === slug);
  if (!item) return null;
  // SECURITY: enforce visibility (owner-preview only via opts).
  if (!isWorkflowVisible(item, opts)) return null;
  return hydrateWorkflow(item);
}

/** List a creator's publicly-visible workflows (newest first). */
export async function listWorkflowsByOwner(
  ownerId: string,
): Promise<WorkflowTemplate[]> {
  // TODO(supabase): query by owner_id with RLS when isSupabaseConfigured().
  const visible = seedWorkflows.filter(
    (w) => w.owner_id === ownerId && isWorkflowVisible(w),
  );
  return sortWorkflows(visible, "newest").map(hydrateWorkflow);
}

/** Featured workflows for the home/landing surface (editor's picks). */
export async function getFeaturedWorkflows(): Promise<WorkflowTemplate[]> {
  const visible = seedWorkflows.filter((w) => isWorkflowVisible(w));
  return sortWorkflows(visible, "editors_picks").slice(0, 4).map(hydrateWorkflow);
}

// ---------------------------------------------------------------------------
// Async facade — plugins.
// ---------------------------------------------------------------------------

/** List publicly-visible plugin listings, filtered + sorted. */
export async function listPlugins(
  filter?: PluginFilter,
): Promise<PluginListing[]> {
  // TODO(supabase): query plugin_listings with RLS when isSupabaseConfigured()
  // (where moderation_status='approved'), translating `filter` into SQL.
  if (isSupabaseConfigured()) {
    // Falls through to seed for now.
  }

  // SECURITY: gate to publicly-visible (approved) listings first.
  const visible = seedPlugins.filter((p) => isPluginVisible(p));
  const filtered = applyPluginFilter(visible, filter);
  const sorted = sortPlugins(filtered, filter?.sort);
  return sorted.map(hydratePlugin);
}

/** Get a single plugin by slug, honoring the visibility invariant. */
export async function getPluginBySlug(
  slug: string,
  opts?: GetContentOptions,
): Promise<PluginListing | null> {
  // TODO(supabase): select plugin_listings where slug=? with RLS.
  const item = seedPlugins.find((p) => p.slug === slug);
  if (!item) return null;
  // SECURITY: enforce visibility (owner-preview only via opts).
  if (!isPluginVisible(item, opts)) return null;
  return hydratePlugin(item);
}

/** List a creator's publicly-visible plugin listings (newest first). */
export async function listPluginsByOwner(
  ownerId: string,
): Promise<PluginListing[]> {
  // TODO(supabase): query by owner_id with RLS when isSupabaseConfigured().
  const visible = seedPlugins.filter(
    (p) => p.owner_id === ownerId && isPluginVisible(p),
  );
  return sortPlugins(visible, "newest").map(hydratePlugin);
}

/** Featured plugins for the home/landing surface (editor's picks). */
export async function getFeaturedPlugins(): Promise<PluginListing[]> {
  const visible = seedPlugins.filter((p) => isPluginVisible(p));
  return sortPlugins(visible, "editors_picks").slice(0, 4).map(hydratePlugin);
}

// ---------------------------------------------------------------------------
// Async facade — creators / profiles.
// ---------------------------------------------------------------------------

/** List public creator profiles with computed aggregate counts. */
export async function listCreators(): Promise<Profile[]> {
  // TODO(supabase): query profiles where profile_visibility='public' with RLS.
  return seedProfiles
    .filter((p) => p.profile_visibility === "public")
    .map(withCreatorAggregates);
}

/**
 * Get a creator profile by handle (public only), with aggregates. Returns null
 * when not found or not public.
 */
export async function getCreatorByHandle(
  handle: string,
): Promise<Profile | null> {
  // TODO(supabase): select profiles where handle=? with RLS.
  const profile = seedProfiles.find((p) => p.handle === handle);
  if (!profile) return null;
  // SECURITY: never expose a private profile through the public facade.
  if (profile.profile_visibility !== "public") return null;
  return withCreatorAggregates(profile);
}

/**
 * Trending creators for discovery surfaces, ranked by their public content's
 * engagement (total likes, then content volume). Verified creators are not
 * fabricated — ranking only uses computed aggregates.
 */
export async function getTrendingCreators(): Promise<Profile[]> {
  const creators = await listCreators();
  return creators.sort((a, b) => {
    const likes = (b.total_likes ?? 0) - (a.total_likes ?? 0);
    if (likes !== 0) return likes;
    const aContent =
      (a.public_workflow_count ?? 0) + (a.public_plugin_count ?? 0);
    const bContent =
      (b.public_workflow_count ?? 0) + (b.public_plugin_count ?? 0);
    return bContent - aContent;
  });
}

// ---------------------------------------------------------------------------
// Async facade — categories.
// ---------------------------------------------------------------------------

/** List active categories, optionally filtered to those matching a type. */
export async function listCategories(
  type?: "workflow" | "plugin",
): Promise<MarketplaceCategory[]> {
  // TODO(supabase): query categories where active=true with RLS.
  const active = seedCategories.filter((c) => c.active);
  const scoped = type
    ? active.filter((c) => c.type === type || c.type === "both")
    : active;
  return [...scoped].sort((a, b) => a.sort_order - b.sort_order);
}

/** Get a single active category by slug. Returns null when not found. */
export async function getCategoryBySlug(
  slug: string,
): Promise<MarketplaceCategory | null> {
  // TODO(supabase): select categories where slug=? with RLS.
  const category = seedCategories.find((c) => c.slug === slug && c.active);
  return category ?? null;
}

// ---------------------------------------------------------------------------
// Async facade — reviews.
// ---------------------------------------------------------------------------

/**
 * List visible reviews for a target (workflow or plugin), newest first, with
 * the author relation hydrated.
 */
export async function listReviews(
  targetType: TargetType,
  targetId: string,
): Promise<MarketplaceReview[]> {
  // TODO(supabase): query reviews where target_type/target_id and
  // moderation_status='visible' with RLS when isSupabaseConfigured().
  return seedReviews
    .filter(
      (r) =>
        r.target_type === targetType &&
        r.target_id === targetId &&
        // SECURITY: only surface reviews that passed moderation.
        r.moderation_status === "visible",
    )
    .sort((a, b) => compareNewest(a.created_at, b.created_at))
    .map(hydrateReview);
}
