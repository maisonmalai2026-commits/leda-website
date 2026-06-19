// ============================================================================
// Demo seed content for the Leda Marketplace.
//
// This module imports the declarative JSON content under content/marketplace/*
// and casts it to the canonical domain types. It is the single source of read
// data when Supabase is not configured (demo mode). It is client-safe: no
// secrets, no Node APIs — only JSON + types.
//
// All content here is demo content (is_demo:true) and is visibly labeled as
// "Demo" in the UI. No real users, reviews, downloads, or revenue.
// ============================================================================

import type {
  MarketplaceCategory,
  MarketplaceReview,
  PluginListing,
  Profile,
  WorkflowTemplate,
} from "@/lib/marketplace/types";

import categoriesJson from "@/content/marketplace/categories.json";
import creatorsJson from "@/content/marketplace/creators.json";
import workflowsJson from "@/content/marketplace/workflows.json";
import pluginsJson from "@/content/marketplace/plugins.json";
import reviewsJson from "@/content/marketplace/reviews.json";

// The JSON is authored to match the domain types exactly. We cast through
// `unknown` so structural string-literal fields (e.g. enums) line up without
// widening the JSON's inferred types.
export const seedCategories = categoriesJson as unknown as MarketplaceCategory[];
export const seedProfiles = creatorsJson as unknown as Profile[];
export const seedWorkflows = workflowsJson as unknown as WorkflowTemplate[];
export const seedPlugins = pluginsJson as unknown as PluginListing[];
export const seedReviews = reviewsJson as unknown as MarketplaceReview[];

/** Look up a seed profile by its id. Returns undefined when not found. */
export function getSeedProfile(id: string): Profile | undefined {
  return seedProfiles.find((profile) => profile.id === id);
}

/** Look up a seed category by its id. Returns undefined when not found. */
export function getSeedCategory(id: string): MarketplaceCategory | undefined {
  return seedCategories.find((category) => category.id === id);
}
