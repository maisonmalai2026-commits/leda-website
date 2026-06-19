// ============================================================================
// Workflow-graph validator.
//
// Templates are declarative JSON graphs limited to WORKFLOW_NODE_TYPES. This
// validator parses, shape-checks, and enforces every safety invariant before a
// graph is ever stored or rendered. It NEVER executes anything — it only reads
// the structure. Any sensitive/outbound action requires an explicit human
// confirmation node plus a result-verification node.
//
// Client/server safe: pure analysis, no Node APIs, no secrets.
// ============================================================================

import {
  WORKFLOW_NODE_TYPES,
  TRIGGER_NODE_TYPES,
  SENSITIVE_NODE_TYPES,
  type ValidationIssue,
  type ValidationResult,
  type WorkflowNodeType,
} from "@/lib/marketplace/types";
import { scanForbiddenContent } from "@/lib/marketplace/validation/patterns";

const NODE_TYPE_SET = new Set<string>(WORKFLOW_NODE_TYPES);
const TRIGGER_SET = new Set<string>(TRIGGER_NODE_TYPES);
const SENSITIVE_SET = new Set<string>(SENSITIVE_NODE_TYPES);

/** Minimal structural views used internally after the shape check. */
interface RawNode {
  id: string;
  type: string;
  label?: unknown;
  config?: unknown;
}

interface RawEdge {
  id?: string;
  source: string;
  target: string;
  condition?: unknown;
}

function err(code: string, message: string, path?: string): ValidationIssue {
  return { severity: "error", code, message, path };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively validate that a config value is a JSON primitive / array / object
 * only. Functions (and other non-JSON values) are rejected, and every string
 * leaf is scanned for forbidden content. Mutates `issues` in place.
 */
function scanConfigValue(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  const t = typeof value;

  if (t === "function") {
    issues.push(
      err("config.function", "Config values may not be functions or code.", path),
    );
    return;
  }

  if (t === "symbol" || t === "bigint" || t === "undefined") {
    issues.push(
      err(
        "config.non_json",
        `Config value at ${path} is not JSON-serializable (${t}).`,
        path,
      ),
    );
    return;
  }

  if (t === "string") {
    issues.push(...scanForbiddenContent(value as string, path));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => scanConfigValue(item, `${path}[${i}]`, issues));
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      // Scan the key text too — keys can smuggle forbidden content.
      issues.push(...scanForbiddenContent(key, `${path}.${key}`));
      scanConfigValue(child, `${path}.${key}`, issues);
    }
  }
  // number / boolean / null are valid JSON primitives — nothing to do.
}

/**
 * Detect cycles via DFS coloring. Returns the set of node ids reachable in a
 * back-edge (i.e. participating in at least one cycle) — we only need to know
 * whether any cycle exists, so a boolean flag is surfaced via the result.
 */
function hasCycle(
  nodeIds: string[],
  adjacency: Map<string, string[]>,
): boolean {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  nodeIds.forEach((id) => color.set(id, WHITE));

  const visit = (id: string): boolean => {
    color.set(id, GRAY);
    for (const next of adjacency.get(id) ?? []) {
      const c = color.get(next);
      if (c === GRAY) return true; // back-edge -> cycle
      if (c === WHITE && visit(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  };

  for (const id of nodeIds) {
    if (color.get(id) === WHITE && visit(id)) return true;
  }
  return false;
}

/** Compute the set of node ids reachable from any trigger node. */
function reachableFromTriggers(
  triggerIds: string[],
  adjacency: Map<string, string[]>,
): Set<string> {
  const seen = new Set<string>();
  const stack = [...triggerIds];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of adjacency.get(id) ?? []) {
      if (!seen.has(next)) stack.push(next);
    }
  }
  return seen;
}

/**
 * Validate a workflow graph. Accepts either a JSON string or a parsed object.
 * Returns { ok, issues } where ok is true only when no "error" issues exist.
 */
export function validateWorkflowGraph(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  // (a) Parse if a string was provided.
  let graph: unknown = input;
  if (typeof input === "string") {
    try {
      graph = JSON.parse(input);
    } catch {
      issues.push(err("json.malformed", "Workflow JSON could not be parsed."));
      return { ok: false, issues };
    }
  }

  // (b) Top-level shape check.
  if (!isPlainObject(graph)) {
    issues.push(err("graph.invalid_shape", "Workflow must be an object."));
    return { ok: false, issues };
  }

  const rawNodes = (graph as Record<string, unknown>).nodes;
  const rawEdges = (graph as Record<string, unknown>).edges;

  if (!Array.isArray(rawNodes)) {
    issues.push(err("graph.invalid_shape", "Workflow `nodes` must be an array."));
  }
  if (!Array.isArray(rawEdges)) {
    issues.push(err("graph.invalid_shape", "Workflow `edges` must be an array."));
  }
  if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
    return { ok: false, issues };
  }

  if (rawNodes.length === 0) {
    issues.push(err("graph.empty", "Workflow must contain at least one node."));
  }

  // Normalize + per-node shape check.
  const nodes: RawNode[] = [];
  const nodeIds = new Set<string>();
  const presentTypes = new Set<WorkflowNodeType>();

  rawNodes.forEach((raw, index) => {
    const at = `nodes[${index}]`;
    if (!isPlainObject(raw)) {
      issues.push(err("node.invalid_shape", "Node must be an object.", at));
      return;
    }
    const id = raw.id;
    const type = raw.type;

    if (typeof id !== "string" || id.length === 0) {
      issues.push(err("node.invalid_id", "Node `id` must be a non-empty string.", at));
      return;
    }
    if (nodeIds.has(id)) {
      issues.push(err("node.duplicate_id", `Duplicate node id "${id}".`, id));
      return;
    }
    nodeIds.add(id);

    // (c) Node type must be in the allow-list.
    if (typeof type !== "string" || !NODE_TYPE_SET.has(type)) {
      issues.push(
        err("node.unknown_type", `Node type "${String(type)}" is not allowed.`, id),
      );
    } else {
      presentTypes.add(type as WorkflowNodeType);
    }

    // (i) Scan the label text.
    if (raw.label !== undefined && typeof raw.label === "string") {
      issues.push(...scanForbiddenContent(raw.label, `${id}.label`));
    }

    // (i/j) Scan + JSON-validate the config object.
    if (raw.config !== undefined) {
      if (!isPlainObject(raw.config)) {
        issues.push(
          err("config.invalid_shape", "Node `config` must be an object.", id),
        );
      } else {
        scanConfigValue(raw.config, `${id}.config`, issues);
      }
    }

    nodes.push({ id, type: type as string, label: raw.label, config: raw.config });
  });

  // Build adjacency from valid edges; validate edge shape + references.
  const adjacency = new Map<string, string[]>();
  nodeIds.forEach((id) => adjacency.set(id, []));

  rawEdges.forEach((raw, index) => {
    const at = `edges[${index}]`;
    if (!isPlainObject(raw)) {
      issues.push(err("edge.invalid_shape", "Edge must be an object.", at));
      return;
    }
    const edge = raw as unknown as RawEdge;
    const source = (raw as Record<string, unknown>).source;
    const target = (raw as Record<string, unknown>).target;

    if (typeof source !== "string" || typeof target !== "string") {
      issues.push(
        err("edge.invalid_shape", "Edge `source` and `target` must be strings.", at),
      );
      return;
    }

    // (f) Dangling reference check.
    let dangling = false;
    if (!nodeIds.has(source)) {
      issues.push(
        err("edge.dangling", `Edge source "${source}" references no node.`, at),
      );
      dangling = true;
    }
    if (!nodeIds.has(target)) {
      issues.push(
        err("edge.dangling", `Edge target "${target}" references no node.`, at),
      );
      dangling = true;
    }

    // Scan an optional condition label.
    if (edge.condition !== undefined && typeof edge.condition === "string") {
      issues.push(...scanForbiddenContent(edge.condition, `${at}.condition`));
    }

    if (!dangling) {
      adjacency.get(source)!.push(target);
    }
  });

  const allNodeIds = [...nodeIds];

  // (d) At least one trigger node.
  const triggerIds = nodes.filter((n) => TRIGGER_SET.has(n.type)).map((n) => n.id);
  if (triggerIds.length === 0) {
    issues.push(
      err(
        "graph.missing_trigger",
        "Workflow must contain at least one trigger node (manual or schedule).",
      ),
    );
  }

  // (e) At least one end node.
  if (!presentTypes.has("end")) {
    issues.push(
      err("graph.missing_end", "Workflow must contain at least one `end` node."),
    );
  }

  // (g) Cycle detection.
  if (hasCycle(allNodeIds, adjacency)) {
    issues.push(err("graph.cycle", "Workflow graph must not contain a cycle."));
  }

  // (h) Unreachable / hidden node detection (only meaningful with a trigger).
  if (triggerIds.length > 0 && allNodeIds.length > 0) {
    const reachable = reachableFromTriggers(triggerIds, adjacency);
    for (const id of allNodeIds) {
      if (!reachable.has(id)) {
        issues.push(
          err(
            "node.unreachable",
            `Node "${id}" is not reachable from any trigger (hidden node).`,
            id,
          ),
        );
      }
    }
  }

  // (k) Risk rule: sensitive/outbound actions demand confirmation + verification.
  const hasSensitive = nodes.some((n) => SENSITIVE_SET.has(n.type));
  if (hasSensitive) {
    if (!presentTypes.has("ask_confirmation")) {
      issues.push(
        err(
          "safety.missing_confirmation",
          "Workflows with sensitive actions must include an `ask_confirmation` node.",
        ),
      );
    }
    if (!presentTypes.has("verify_result")) {
      issues.push(
        err(
          "safety.missing_verification",
          "Workflows with sensitive actions must include a `verify_result` node.",
        ),
      );
    }
  }

  const ok = !issues.some((i) => i.severity === "error");
  return { ok, issues };
}
