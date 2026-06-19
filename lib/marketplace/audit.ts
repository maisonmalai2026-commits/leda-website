import "server-only";

// ============================================================================
// Audit log (server-only).
//
// Records moderation actions and payment state changes. In demo mode (no
// Supabase) this appends a single JSON line to data/marketplace/audit.log so a
// local developer can inspect what happened — it is best-effort and never throws
// into the caller. In Supabase mode the same call would insert a row into the
// moderation_actions / audit table (TODO below).
//
// IMPORTANT: never import this from a client component. It uses Node's fs/path.
// ============================================================================

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { isSupabaseConfigured } from "@/lib/marketplace/config";

export interface AuditEntry {
  /** Who performed the action (user id, "system", or "stripe"). */
  actor: string;
  /** Stable action verb, e.g. "moderate.approve", "payment.checkout_created". */
  action: string;
  targetType?: string;
  targetId?: string;
  /** Arbitrary JSON-safe context. Never include secrets. */
  metadata?: Record<string, unknown>;
}

/** Directory + file the demo log is written to (relative to the project root). */
const AUDIT_DIR = path.join(process.cwd(), "data", "marketplace");
const AUDIT_FILE = path.join(AUDIT_DIR, "audit.log");

/**
 * Append an audit entry. Best-effort: any I/O failure is swallowed (logged to
 * the server console) so an audit write can never break the user-facing action.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const record = {
    ts: new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  };

  if (isSupabaseConfigured()) {
    // TODO(supabase): insert into a durable audit/moderation_actions table using
    // the service-role client (getServiceClient) inside trusted server code.
    // Until that lands, fall through to the local file log so nothing is lost.
  }

  try {
    await mkdir(AUDIT_DIR, { recursive: true });
    await appendFile(AUDIT_FILE, `${JSON.stringify(record)}\n`, "utf8");
  } catch (err) {
    // Best-effort only — never propagate an audit-logging failure.
    console.error("[audit] failed to write audit entry", err);
  }
}
