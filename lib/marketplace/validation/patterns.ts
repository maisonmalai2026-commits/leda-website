// ============================================================================
// Forbidden-content scanner.
//
// The marketplace is declarative-only: workflow templates and plugin listings
// are metadata + JSON config. They must NEVER carry executable code, secrets,
// local file paths, or links to runnable artifacts. This module pattern-scans
// arbitrary text (labels, descriptions, config values, URLs) and returns a
// ValidationIssue for every forbidden signal it finds.
//
// Client/server safe: pure string analysis, no Node APIs, no secrets.
// ============================================================================

import type { ValidationIssue } from "@/lib/marketplace/types";

/**
 * Node "types" that must never appear in a template — hidden/code-execution
 * shaped node kinds. The graph validator enforces the allow-list separately
 * (WORKFLOW_NODE_TYPES); this note documents the categories we actively reject
 * so reviewers understand intent.
 */
export const FORBIDDEN_NODE_TYPES = [
  "code",
  "script",
  "shell",
  "exec",
  "eval",
  "python",
  "javascript",
  "http_raw",
  "webhook_raw",
  "function",
] as const;

// ---------------------------------------------------------------------------
// Named pattern constants (grouped by category). All matched case-insensitive.
// ---------------------------------------------------------------------------

/** Python source-code signals. */
const PYTHON_PATTERNS: RegExp[] = [
  /\bimport\s+[A-Za-z_][\w.]*/i,
  /\bfrom\s+[A-Za-z_][\w.]*\s+import\b/i,
  /\bdef\s+[A-Za-z_]\w*\s*\(/i,
  /__import__\s*\(/i,
  /\bos\.system\s*\(/i,
  /\bsubprocess\b/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
];

/** JavaScript / general-code signals. */
const JS_PATTERNS: RegExp[] = [
  /\bfunction\s*\(/i,
  /=>/,
  /\beval\s*\(/i,
  /\brequire\s*\(/i,
  /\bprocess\.env\b/i,
  /\bchild_process\b/i,
  /<script\b/i,
  /\bnew\s+Function\s*\(/i,
];

/** Shell / command-injection signals. */
const SHELL_PATTERNS: RegExp[] = [
  /\brm\s+-rf\b/i,
  /\bcurl\s+/i,
  /\bwget\s+/i,
  /\bbash\s+/i,
  /\bpowershell\b/i,
  /\bcmd\.exe\b/i,
  /&&/,
  /\|\s*\w/, // a pipe feeding another command
  /;\s*rm\b/i,
];

/** Secrets / credentials / API keys. */
const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9]{8,}\b/i, // OpenAI-style secret keys
  /\bapi[_-]?key\b/i,
  /\bsecret\b/i,
  /\bpassword\b/i,
  /\btoken\b/i,
  /\bbearer\s+[A-Za-z0-9._-]+/i,
  /\bAKIA[0-9A-Z]{12,}\b/, // AWS access key id (case-sensitive prefix)
  /-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/i,
];

/** Browser cookies / session material. */
const COOKIE_PATTERNS: RegExp[] = [
  /\bdocument\.cookie\b/i,
  /\bCookie:\s/i,
  /\bsession=/i,
  /\bsessionid\b/i,
];

/** .env / dotenv references. */
const DOTENV_PATTERNS: RegExp[] = [
  /\.env\b/i,
  /\bdotenv\b/i,
];

/** Local file paths (Windows, UNC, POSIX, file://). */
const LOCAL_PATH_PATTERNS: RegExp[] = [
  /[A-Za-z]:\\/, // Windows drive path e.g. C:\
  /\\\\[^\\]/, // UNC path \\server
  /\/home\//i,
  /\/Users\//,
  /\/etc\//i,
  /\bfile:\/\//i,
];

/** Executable / archive artifacts (extensions, optionally as URLs). */
const EXECUTABLE_EXTENSIONS = [
  ".exe",
  ".dll",
  ".sh",
  ".bat",
  ".ps1",
  ".zip",
  ".msi",
  ".apk",
  ".dmg",
] as const;

/** Matches any executable/archive extension at a path/URL boundary. */
const EXECUTABLE_PATTERN: RegExp = new RegExp(
  "(?:" +
    EXECUTABLE_EXTENSIONS.map((e) => e.replace(".", "\\.")).join("|") +
    ")(?:[?#\\s\"')]|$)",
  "i",
);

// ---------------------------------------------------------------------------
// Category registry — each entry maps a stable code + message to its patterns.
// ---------------------------------------------------------------------------

interface PatternCategory {
  code: string;
  message: string;
  patterns: RegExp[];
}

const CATEGORIES: PatternCategory[] = [
  {
    code: "forbidden.python",
    message: "Python source code is not allowed in declarative content.",
    patterns: PYTHON_PATTERNS,
  },
  {
    code: "forbidden.javascript",
    message: "JavaScript/code is not allowed in declarative content.",
    patterns: JS_PATTERNS,
  },
  {
    code: "forbidden.shell",
    message: "Shell commands are not allowed in declarative content.",
    patterns: SHELL_PATTERNS,
  },
  {
    code: "forbidden.secret",
    message: "Secrets, API keys, or credentials must not be included.",
    patterns: SECRET_PATTERNS,
  },
  {
    code: "forbidden.cookie",
    message: "Browser cookies or session material must not be included.",
    patterns: COOKIE_PATTERNS,
  },
  {
    code: "forbidden.dotenv",
    message: "References to .env / dotenv files are not allowed.",
    patterns: DOTENV_PATTERNS,
  },
  {
    code: "forbidden.local_path",
    message: "Local file paths must not be referenced.",
    patterns: LOCAL_PATH_PATTERNS,
  },
  {
    code: "forbidden.executable",
    message: "Links to executable or archive files are not allowed.",
    patterns: [EXECUTABLE_PATTERN],
  },
];

/**
 * Scan a single text value for forbidden content. Returns one issue per
 * category that matched (de-duplicated by code). Empty/non-string input yields
 * no issues. `path` (e.g. a node id or field name) is attached for reporting.
 */
export function scanForbiddenContent(text: string, path?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof text !== "string" || text.length === 0) {
    return issues;
  }

  for (const category of CATEGORIES) {
    if (category.patterns.some((re) => re.test(text))) {
      issues.push({
        severity: "error",
        code: category.code,
        message: category.message,
        path,
      });
    }
  }

  return issues;
}

/** Convenience: true when the text contains any forbidden signal. */
export function hasForbiddenContent(text: string): boolean {
  return scanForbiddenContent(text).length > 0;
}

/** Exposed so URL validators can reuse the executable/archive detection. */
export function isExecutableOrArchiveUrl(url: string): boolean {
  return typeof url === "string" && EXECUTABLE_PATTERN.test(url);
}
