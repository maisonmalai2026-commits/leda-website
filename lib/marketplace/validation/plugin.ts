// ============================================================================
// Plugin-listing validator.
//
// Community plugin submissions are metadata-only: a name, descriptions, a
// category, a version, and a handful of informational URLs. They may NOT ship a
// raw downloadable package, link to executables/archives, leak secrets, or be
// submitted without an explicit safety-confirmation checkbox.
//
// Client/server safe: pure analysis, no Node APIs, no secrets.
// ============================================================================

import {
  INSTALLATION_MODEL,
  type InstallationModel,
  type ValidationIssue,
  type ValidationResult,
} from "@/lib/marketplace/types";
import {
  scanForbiddenContent,
  isExecutableOrArchiveUrl,
} from "@/lib/marketplace/validation/patterns";

const INSTALLATION_MODEL_SET = new Set<string>(INSTALLATION_MODEL);

/**
 * Installation models a community submission is allowed to declare. Raw /
 * downloadable package delivery is intentionally excluded — listings are
 * metadata-only until a signed-package pipeline exists.
 */
export const ALLOWED_SUBMISSION_INSTALLATION_MODELS: InstallationModel[] = [
  "listing_only",
  "native_builtin",
];
const ALLOWED_SUBMISSION_SET = new Set<string>(
  ALLOWED_SUBMISSION_INSTALLATION_MODELS,
);

/** Optional URL fields that get validated when present. */
const URL_FIELDS = ["source_url", "documentation_url", "support_url"] as const;

/** Required string fields and their reporting paths. */
const REQUIRED_FIELDS = [
  "name",
  "short_description",
  "long_description",
  "category_id",
  "version",
] as const;

function err(code: string, message: string, path?: string): ValidationIssue {
  return { severity: "error", code, message, path };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export interface ValidatePluginOptions {
  /** Must be true: the submitter checked the safety/ownership confirmation. */
  confirmed?: boolean;
}

/**
 * Validate a plugin listing submission. Returns { ok, issues } where ok is true
 * only when no "error" issues exist.
 */
export function validatePluginListing(
  input: unknown,
  opts?: ValidatePluginOptions,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isPlainObject(input)) {
    issues.push(err("plugin.invalid_shape", "Plugin listing must be an object."));
    return { ok: false, issues };
  }

  const listing = input as Record<string, unknown>;

  // Required fields present + non-empty.
  for (const field of REQUIRED_FIELDS) {
    if (!isNonEmptyString(listing[field])) {
      issues.push(
        err("plugin.missing_field", `Field "${field}" is required.`, field),
      );
    }
  }

  // Scan every text field for forbidden content (descriptions, instructions,
  // changelog, tags, etc.).
  const textFields = [
    "name",
    "short_description",
    "long_description",
    "installation_instructions",
    "changelog",
    "category_id",
    "version",
  ] as const;
  for (const field of textFields) {
    const value = listing[field];
    if (typeof value === "string") {
      issues.push(...scanForbiddenContent(value, field));
    }
  }

  // String-array fields (tags, compatibility, permissions, etc.) — scan each.
  const arrayFields = [
    "tags",
    "compatibility",
    "required_apps",
    "declared_permissions",
    "cannot_access",
    "screenshots",
  ] as const;
  for (const field of arrayFields) {
    const value = listing[field];
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "string") {
          issues.push(...scanForbiddenContent(item, `${field}[${i}]`));
        }
      });
    }
  }

  // installation_model must be a known value AND allowed for submissions.
  const installationModel = listing.installation_model;
  if (installationModel !== undefined && installationModel !== null) {
    if (
      typeof installationModel !== "string" ||
      !INSTALLATION_MODEL_SET.has(installationModel)
    ) {
      issues.push(
        err(
          "plugin.invalid_installation",
          `Unknown installation model "${String(installationModel)}".`,
          "installation_model",
        ),
      );
    } else if (!ALLOWED_SUBMISSION_SET.has(installationModel)) {
      issues.push(
        err(
          "plugin.disallowed_installation",
          "Community submissions may only be `listing_only` or `native_builtin`. " +
            "Downloadable packages are not accepted.",
          "installation_model",
        ),
      );
    }
  }

  // URL fields: must be http(s) and must not point at executables/archives.
  for (const field of URL_FIELDS) {
    const value = listing[field];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string") {
      issues.push(err("url.invalid", `Field "${field}" must be a URL string.`, field));
      continue;
    }
    // Also scan the URL for forbidden content (local paths, file://, etc.).
    issues.push(...scanForbiddenContent(value, field));

    let parsed: URL | null = null;
    try {
      parsed = new URL(value);
    } catch {
      parsed = null;
    }
    if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      issues.push(
        err("url.invalid", `Field "${field}" must be an http(s) URL.`, field),
      );
      continue;
    }
    if (isExecutableOrArchiveUrl(value)) {
      issues.push(
        err(
          "url.executable",
          `Field "${field}" must not link to an executable or archive file.`,
          field,
        ),
      );
    }
  }

  // The safety/ownership confirmation checkbox is mandatory.
  if (opts?.confirmed !== true) {
    issues.push(
      err(
        "plugin.unconfirmed",
        "You must confirm the listing is safe and you have rights to publish it.",
      ),
    );
  }

  const ok = !issues.some((i) => i.severity === "error");
  return { ok, issues };
}
