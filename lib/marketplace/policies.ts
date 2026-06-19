// ============================================================================
// Shared, static marketplace policy copy.
//
// Client-safe and route-free: just constants so multiple policy pages can share
// the same single source of truth (e.g. the community rules) without importing
// from one another's route `page.tsx`.
// ============================================================================

/**
 * The community rules that apply to every workflow, tool listing, review, and
 * profile. This is the canonical list rendered on the policies hub and echoed
 * (in full or relevant subsets) on the creator-guidelines and plugin-safety
 * pages.
 */
export const COMMUNITY_RULES: readonly string[] = [
  "No malware or malicious code",
  "No credential theft",
  "No cookie extraction",
  "No hidden data collection",
  "No deceptive workflows",
  "No spam or bulk messaging",
  "No fraud",
  "No crypto wallet or seed-phrase handling",
  "No arbitrary executable uploads",
  "No fake reviews",
  "No impersonation",
  "No copyright violation",
  "No permission or verification bypass",
];
