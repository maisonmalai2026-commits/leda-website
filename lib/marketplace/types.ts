// ============================================================================
// Leda Marketplace — canonical domain types (Phase 2)
//
// This file is the single source of truth for marketplace data shapes. Every
// data provider (demo + Supabase), validator, page, and API route imports from
// here. The shapes mirror the SQL tables in /supabase/migrations.
//
// IMPORTANT: This module is safe to import from both client and server. It
// contains only types and constants — no secrets, no Node APIs.
// ============================================================================

/** JSON-safe value. Used for node configuration to forbid functions/code. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

// ---------------------------------------------------------------------------
// Enums (kept as string-literal unions + const arrays for runtime iteration)
// ---------------------------------------------------------------------------

export const USER_ROLES = ["user", "creator", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Includes the implicit "guest" (not signed in) for UI gating. */
export type Role = UserRole | "guest";

export const PROFILE_VISIBILITY = ["public", "private"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];

export const CREATOR_STATUS = ["none", "active", "suspended"] as const;
export type CreatorStatus = (typeof CREATOR_STATUS)[number];

/** Visibility of a piece of content. */
export const VISIBILITY = ["public", "unlisted", "private"] as const;
export type Visibility = (typeof VISIBILITY)[number];

/** Human-review lifecycle for submitted content. No AI auto-approval. */
export const MODERATION_STATUS = [
  "draft",
  "pending",
  "approved",
  "changes_requested",
  "rejected",
  "deprecated",
  "removed",
] as const;
export type ModerationStatus = (typeof MODERATION_STATUS)[number];

/** Trust tier shown on plugin listings. */
export const TRUST_STATUS = [
  "official",
  "verified",
  "community",
  "experimental",
  "rejected",
  "deprecated",
  "coming_soon",
] as const;
export type TrustStatus = (typeof TRUST_STATUS)[number];

export const RISK_LEVEL = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVEL)[number];

/** The ONLY node types a safe declarative workflow template may contain. */
export const WORKFLOW_NODE_TYPES = [
  "manual_trigger",
  "schedule_trigger",
  "main_brain",
  "call_native_plugin",
  "call_dify_plugin",
  "condition",
  "ask_confirmation",
  "wait",
  "verify_result",
  "notify_user",
  "end",
] as const;
export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];

/** Trigger node types. */
export const TRIGGER_NODE_TYPES = ["manual_trigger", "schedule_trigger"] as const;

/** Node types that perform potentially sensitive/outbound actions. */
export const SENSITIVE_NODE_TYPES = [
  "call_native_plugin",
  "call_dify_plugin",
  "notify_user",
] as const;

/** Difficulty label for workflow templates. */
export const SKILL_LEVEL = ["beginner", "intermediate", "advanced"] as const;
export type SkillLevel = (typeof SKILL_LEVEL)[number];

/** Polymorphic target for likes/bookmarks/reviews/reports. */
export const TARGET_TYPE = ["workflow", "plugin", "profile"] as const;
export type TargetType = (typeof TARGET_TYPE)[number];

/** How a plugin is delivered. Listings are metadata-only for now. */
export const INSTALLATION_MODEL = [
  "listing_only",
  "native_builtin",
  "signed_package_future",
] as const;
export type InstallationModel = (typeof INSTALLATION_MODEL)[number];

/** Pricing model — only "free" is implemented for the MVP. */
export const PRICING_MODEL = ["free", "one_time", "subscription", "donation"] as const;
export type PricingModel = (typeof PRICING_MODEL)[number];

export const ORDER_STATUS = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "disputed",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const ENTITLEMENT_TYPE = ["free", "purchased", "admin_granted"] as const;
export type EntitlementType = (typeof ENTITLEMENT_TYPE)[number];

export const CATEGORY_TYPE = ["workflow", "plugin", "both"] as const;
export type CategoryType = (typeof CATEGORY_TYPE)[number];

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  profile_visibility: ProfileVisibility;
  role: UserRole;
  creator_status: CreatorStatus;
  is_verified_creator: boolean;
  created_at: string;
  updated_at: string;
  // Derived/aggregate fields (read-only, computed by provider):
  public_workflow_count?: number;
  public_plugin_count?: number;
  total_likes?: number;
  follower_count?: number;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: CategoryType;
  sort_order: number;
  active: boolean;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  /** JSON-safe declarative config only. Never code. Validator enforces this. */
  config?: Record<string, JsonValue>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  /** Optional label for branches out of a condition node. */
  condition?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface RequiredPlugin {
  /** References a plugin listing slug when known. */
  slug: string;
  name: string;
  /** Whether this plugin is required or optional for the workflow. */
  optional?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  category_id: string;
  tags: string[];
  workflow_json: WorkflowGraph;
  /** Read-only simplified graph for display. Derived from workflow_json. */
  preview_graph_json: WorkflowGraph | null;
  required_plugins: RequiredPlugin[];
  declared_permissions: string[];
  risk_level: RiskLevel;
  skill_level: SkillLevel;
  visibility: Visibility;
  moderation_status: ModerationStatus;
  pricing_model: PricingModel;
  version: string;
  copied_count: number;
  like_count: number;
  bookmark_count: number;
  rating_avg: number;
  rating_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Hydrated relations (optional, filled by provider). */
  owner?: Profile;
  category?: MarketplaceCategory;
  /** Demo/seed content marker — never a real user submission. */
  is_demo?: boolean;
}

export interface WorkflowTemplateVersion {
  id: string;
  workflow_template_id: string;
  version: string;
  workflow_json: WorkflowGraph;
  changelog: string;
  created_at: string;
}

export interface PluginListing {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  icon_url: string | null;
  short_description: string;
  long_description: string;
  category_id: string;
  tags: string[];
  compatibility: string[];
  required_apps: string[];
  declared_permissions: string[];
  /** What the plugin explicitly cannot access (shown for transparency). */
  cannot_access: string[];
  installation_model: InstallationModel;
  installation_instructions: string | null;
  source_url: string | null;
  documentation_url: string | null;
  support_url: string | null;
  screenshots: string[];
  version: string;
  changelog: string;
  trust_status: TrustStatus;
  moderation_status: ModerationStatus;
  pricing_model: PricingModel;
  like_count: number;
  bookmark_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  category?: MarketplaceCategory;
  is_demo?: boolean;
}

export interface PluginListingVersion {
  id: string;
  plugin_listing_id: string;
  version: string;
  changelog: string;
  /** Snapshot of the listing metadata at this version. */
  listing_snapshot: Record<string, JsonValue>;
  created_at: string;
}

export interface MarketplaceReview {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  rating: number; // 1..5
  body: string;
  moderation_status: "visible" | "hidden" | "pending";
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "id" | "handle" | "display_name" | "avatar_url">;
}

export interface MarketplaceLike {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  created_at: string;
}

export interface MarketplaceBookmark {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  created_at: string;
}

export interface CreatorFollow {
  follower_id: string;
  creator_id: string;
  created_at: string;
}

export interface MarketplaceReport {
  id: string;
  reporter_id: string;
  target_type: TargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  moderator_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: TargetType;
  target_id: string;
  action: string;
  reason: string | null;
  metadata: Record<string, JsonValue> | null;
  created_at: string;
}

export interface CreatorPayoutProfile {
  id: string;
  owner_id: string;
  stripe_account_id: string | null;
  onboarding_status: "not_started" | "pending" | "complete";
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  target_type: TargetType;
  target_id: string;
  amount: number;
  currency: string;
  platform_fee_amount: number;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceEntitlement {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  order_id: string | null;
  entitlement_type: EntitlementType;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string | null;
  role: UserRole;
  profile: Profile;
  /** True when this session came from the demo cookie, not real Supabase auth. */
  is_demo: boolean;
}

// ---------------------------------------------------------------------------
// Query / filter / sort shapes for galleries
// ---------------------------------------------------------------------------

export type WorkflowSort =
  | "trending"
  | "newest"
  | "most_copied"
  | "highest_rated"
  | "editors_picks";

export interface WorkflowFilter {
  query?: string;
  category?: string;
  tag?: string;
  tool?: string;
  skill_level?: SkillLevel;
  trigger?: "manual" | "scheduled";
  risk_level?: RiskLevel;
  trust?: TrustStatus;
  pricing?: PricingModel;
  status?: "available" | "coming_soon";
  sort?: WorkflowSort;
}

export type PluginSort = "trending" | "newest" | "highest_rated" | "editors_picks";

export interface PluginFilter {
  query?: string;
  category?: string;
  trust_status?: TrustStatus;
  required_app?: string;
  pricing?: PricingModel;
  sort?: PluginSort;
}

// ---------------------------------------------------------------------------
// Validation result shapes (shared by workflow + plugin validators)
// ---------------------------------------------------------------------------

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  /** Optional pointer e.g. node id or field name. */
  path?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/** Standard envelope returned by all marketplace mutation actions. */
export interface ActionResult<T = undefined> {
  ok: boolean;
  /** True when the action ran in local demo mode (not persisted). */
  demo?: boolean;
  message?: string;
  error?: string;
  data?: T;
  issues?: ValidationIssue[];
}
