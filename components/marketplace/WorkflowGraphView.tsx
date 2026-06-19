import {
  Play,
  CalendarClock,
  BrainCircuit,
  Plug,
  Boxes,
  GitBranch,
  ShieldQuestion,
  Timer,
  BadgeCheck,
  Bell,
  CircleStop,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  TRIGGER_NODE_TYPES,
  SENSITIVE_NODE_TYPES,
  type WorkflowGraph,
  type WorkflowNode,
  type WorkflowNodeType,
} from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// Read-only workflow renderer — pure SVG/CSS, no graph libraries.
//
// Nodes are placed top-to-bottom in topological order (Kahn's algorithm with a
// stable fallback for cycles / disconnected graphs). Edges are drawn as SVG
// paths with arrowheads. Each node type gets a distinct color + lucide icon.
// ---------------------------------------------------------------------------

const triggerSet = new Set<WorkflowNodeType>(TRIGGER_NODE_TYPES);
const sensitiveSet = new Set<WorkflowNodeType>(SENSITIVE_NODE_TYPES);

type NodeKind = "trigger" | "end" | "sensitive" | "confirmation" | "verify" | "default";

function nodeKind(type: WorkflowNodeType): NodeKind {
  if (triggerSet.has(type)) return "trigger";
  if (type === "end") return "end";
  if (type === "ask_confirmation") return "confirmation";
  if (type === "verify_result") return "verify";
  if (sensitiveSet.has(type)) return "sensitive";
  return "default";
}

const nodeMeta: Record<
  WorkflowNodeType,
  { label: string; Icon: LucideIcon }
> = {
  manual_trigger: { label: "Manual trigger", Icon: Play },
  schedule_trigger: { label: "Schedule trigger", Icon: CalendarClock },
  main_brain: { label: "Main brain", Icon: BrainCircuit },
  call_native_plugin: { label: "Call native plugin", Icon: Plug },
  call_dify_plugin: { label: "Call Dify plugin", Icon: Boxes },
  condition: { label: "Condition", Icon: GitBranch },
  ask_confirmation: { label: "Ask confirmation", Icon: ShieldQuestion },
  wait: { label: "Wait", Icon: Timer },
  verify_result: { label: "Verify result", Icon: BadgeCheck },
  notify_user: { label: "Notify user", Icon: Bell },
  end: { label: "End", Icon: CircleStop },
};

const kindStyles: Record<
  NodeKind,
  { box: string; iconWrap: string }
> = {
  trigger: {
    box: "border-accent-teal/30 bg-accent-teal/[0.08]",
    iconWrap: "border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
  },
  end: {
    box: "border-white/[0.12] bg-white/[0.04]",
    iconWrap: "border-white/12 bg-white/[0.05] text-ink-muted",
  },
  sensitive: {
    box: "border-amber-400/30 bg-amber-400/[0.07]",
    iconWrap: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  confirmation: {
    box: "border-rose-400/30 bg-rose-400/[0.06]",
    iconWrap: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
  verify: {
    box: "border-accent-sky/30 bg-accent-sky/[0.07]",
    iconWrap: "border-accent-sky/30 bg-accent-sky/10 text-accent-sky",
  },
  default: {
    box: "border-accent-blue/25 bg-accent-blue/[0.06]",
    iconWrap: "border-accent-blue/30 bg-accent-blue/10 text-accent-sky",
  },
};

// Layout constants (SVG user units == px at scale 1).
const NODE_W = 220;
const NODE_H = 64;
const ROW_GAP = 56;
const COL_GAP = 40;
const PAD = 24;

interface Placed {
  node: WorkflowNode;
  level: number;
  col: number;
  x: number;
  y: number;
}

// Assign a level (row) to each node using a longest-path layering over a DAG.
// Cyclic / dangling edges degrade gracefully: any node never reached keeps its
// input order level so nothing is dropped.
function layout(graph: WorkflowGraph): { placed: Placed[]; width: number; height: number } {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    indegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  }

  const level = new Map<string, number>();
  // Seed with all zero-indegree nodes; if none (pure cycle), seed with the
  // first node so we still produce a layout.
  let frontier = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  if (frontier.length === 0 && nodes.length > 0) frontier = [nodes[0].id];
  for (const id of frontier) level.set(id, 0);

  const remaining = new Map(indegree);
  const queue = [...frontier];
  const visited = new Set(frontier);
  while (queue.length > 0) {
    const id = queue.shift()!;
    const curLevel = level.get(id) ?? 0;
    for (const next of adj.get(id) ?? []) {
      level.set(next, Math.max(level.get(next) ?? 0, curLevel + 1));
      const left = (remaining.get(next) ?? 0) - 1;
      remaining.set(next, left);
      if (left <= 0 && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  // Any node not reached (cycle remnant / isolated) gets stacked after the max.
  let maxLevel = 0;
  for (const v of level.values()) maxLevel = Math.max(maxLevel, v);
  for (const n of nodes) {
    if (!level.has(n.id)) {
      maxLevel += 1;
      level.set(n.id, maxLevel);
    }
  }

  // Group by level, assign columns within each level for parallel branches.
  const byLevel = new Map<number, WorkflowNode[]>();
  for (const n of nodes) {
    const l = level.get(n.id) ?? 0;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)!.push(n);
  }

  let maxCols = 1;
  for (const group of byLevel.values()) {
    maxCols = Math.max(maxCols, group.length);
  }

  const totalWidth = maxCols * NODE_W + (maxCols - 1) * COL_GAP;
  const placed: Placed[] = [];
  const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);

  sortedLevels.forEach((l) => {
    const group = byLevel.get(l)!;
    const groupWidth = group.length * NODE_W + (group.length - 1) * COL_GAP;
    const startX = PAD + (totalWidth - groupWidth) / 2;
    group.forEach((node, col) => {
      placed.push({
        node,
        level: l,
        col,
        x: startX + col * (NODE_W + COL_GAP),
        y: PAD + l * (NODE_H + ROW_GAP),
      });
    });
  });

  const width = totalWidth + PAD * 2;
  const height = PAD * 2 + (sortedLevels.length || 1) * NODE_H + Math.max(0, (sortedLevels.length || 1) - 1) * ROW_GAP;
  return { placed, width, height };
}

export function WorkflowGraphView({
  graph,
  className,
}: {
  graph: WorkflowGraph;
  className?: string;
}) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  if (nodes.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.10] bg-surface/40 px-6 py-10 text-sm text-ink-muted",
          className,
        )}
      >
        <Workflow className="h-4 w-4" aria-hidden />
        No workflow steps to preview.
      </div>
    );
  }

  const { placed, width, height } = layout(graph);
  const posById = new Map(placed.map((p) => [p.node.id, p]));

  // Build edge paths between node centers (bottom of source -> top of target).
  const drawableEdges = edges.filter(
    (e) => posById.has(e.source) && posById.has(e.target),
  );

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-white/[0.08] bg-surface p-2 shadow-card",
        className,
      )}
      role="group"
      aria-label="Workflow diagram (read-only)"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="max-w-none"
        role="img"
        aria-label={`Workflow with ${nodes.length} steps and ${drawableEdges.length} connections`}
      >
        <defs>
          <marker
            id="wf-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(154,167,189,0.7)" />
          </marker>
        </defs>

        {/* Edges first so nodes render on top. */}
        <g>
          {drawableEdges.map((e) => {
            const a = posById.get(e.source)!;
            const b = posById.get(e.target)!;
            const x1 = a.x + NODE_W / 2;
            const y1 = a.y + NODE_H;
            const x2 = b.x + NODE_W / 2;
            const y2 = b.y;
            // Smooth vertical cubic; horizontal offset handled by control pts.
            const midY = (y1 + y2) / 2;
            const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
            return (
              <g key={e.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(154,167,189,0.45)"
                  strokeWidth={1.5}
                  markerEnd="url(#wf-arrow)"
                />
                {e.condition ? (
                  <text
                    x={(x1 + x2) / 2}
                    y={midY - 4}
                    textAnchor="middle"
                    className="fill-ink-faint"
                    style={{ fontSize: 11 }}
                  >
                    {e.condition}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>

        {/* Nodes as foreignObject so we can reuse Tailwind + lucide icons. */}
        <g>
          {placed.map((p) => {
            const meta = nodeMeta[p.node.type];
            const kind = nodeKind(p.node.type);
            const styles = kindStyles[kind];
            const Icon = meta?.Icon ?? Workflow;
            const typeLabel = meta?.label ?? p.node.type;
            return (
              <foreignObject
                key={p.node.id}
                x={p.x}
                y={p.y}
                width={NODE_W}
                height={NODE_H}
              >
                <div
                  className={cn(
                    "flex h-full w-full items-center gap-3 rounded-xl border px-3",
                    styles.box,
                  )}
                  title={`${typeLabel}: ${p.node.label}`}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      styles.iconWrap,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium leading-tight text-ink">
                      {p.node.label}
                    </span>
                    <span className="block truncate text-[11px] leading-tight text-ink-faint">
                      {typeLabel}
                    </span>
                  </span>
                </div>
              </foreignObject>
            );
          })}
        </g>
      </svg>

      {/* Accessible text fallback / legend for screen readers and no-SVG. */}
      <ol className="sr-only">
        {placed.map((p) => {
          const meta = nodeMeta[p.node.type];
          return (
            <li key={p.node.id}>
              {meta?.label ?? p.node.type}: {p.node.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
