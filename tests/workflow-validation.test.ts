import { describe, it, expect } from "vitest";
import { validateWorkflowGraph } from "@/lib/marketplace/validation/workflow";
import type { ValidationResult } from "@/lib/marketplace/types";

/** Issue codes present in a result. */
function codes(result: ValidationResult): string[] {
  return result.issues.map((i) => i.code);
}

/**
 * A minimal valid graph: manual trigger -> main brain -> end. No sensitive
 * actions, so no confirmation/verification needed.
 */
function cleanGraph() {
  return {
    nodes: [
      { id: "t", type: "manual_trigger", label: "Start" },
      { id: "b", type: "main_brain", label: "Think" },
      { id: "e", type: "end", label: "Done" },
    ],
    edges: [
      { id: "e1", source: "t", target: "b" },
      { id: "e2", source: "b", target: "e" },
    ],
  };
}

/**
 * A valid HIGH-RISK graph: includes a sensitive action plus the required
 * confirmation and verification nodes.
 */
function safeHighRiskGraph() {
  return {
    nodes: [
      { id: "t", type: "manual_trigger", label: "Start" },
      { id: "ask", type: "ask_confirmation", label: "Confirm?" },
      { id: "call", type: "call_native_plugin", label: "Send email" },
      { id: "verify", type: "verify_result", label: "Check it sent" },
      { id: "e", type: "end", label: "Done" },
    ],
    edges: [
      { id: "e1", source: "t", target: "ask" },
      { id: "e2", source: "ask", target: "call" },
      { id: "e3", source: "call", target: "verify" },
      { id: "e4", source: "verify", target: "e" },
    ],
  };
}

describe("validateWorkflowGraph — happy paths", () => {
  it("accepts a clean minimal graph (object input)", () => {
    const result = validateWorkflowGraph(cleanGraph());
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accepts a clean graph passed as a JSON string", () => {
    const result = validateWorkflowGraph(JSON.stringify(cleanGraph()));
    expect(result.ok).toBe(true);
  });

  it("accepts a schedule trigger as a valid trigger", () => {
    const g = cleanGraph();
    g.nodes[0] = { id: "t", type: "schedule_trigger", label: "Daily" };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(true);
  });
});

describe("validateWorkflowGraph — parsing & shape", () => {
  it("flags malformed JSON", () => {
    const result = validateWorkflowGraph("{ not valid json ");
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("json.malformed");
  });

  it("rejects a non-object graph", () => {
    const result = validateWorkflowGraph(42);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("graph.invalid_shape");
  });

  it("rejects missing nodes/edges arrays", () => {
    const result = validateWorkflowGraph({ nodes: "x", edges: [] });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("graph.invalid_shape");
  });

  it("rejects a node with no id", () => {
    const g = cleanGraph();
    // @ts-expect-error intentionally malformed
    g.nodes.push({ type: "end", label: "x" });
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("node.invalid_id");
  });

  it("rejects duplicate node ids", () => {
    const g = cleanGraph();
    g.nodes.push({ id: "t", type: "end", label: "dup" });
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("node.duplicate_id");
  });
});

describe("validateWorkflowGraph — node types", () => {
  it("rejects an unknown node type", () => {
    const g = cleanGraph();
    g.nodes.push({ id: "x", type: "run_python", label: "danger" });
    g.edges.push({ id: "e3", source: "b", target: "x" });
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("node.unknown_type");
  });

  it("rejects a hidden code node type", () => {
    const g = cleanGraph();
    g.nodes.push({ id: "x", type: "code", label: "danger" });
    g.edges.push({ id: "e3", source: "b", target: "x" });
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("node.unknown_type");
  });
});

describe("validateWorkflowGraph — structural invariants", () => {
  it("flags a missing trigger", () => {
    const g = {
      nodes: [
        { id: "b", type: "main_brain", label: "Think" },
        { id: "e", type: "end", label: "Done" },
      ],
      edges: [{ id: "e1", source: "b", target: "e" }],
    };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("graph.missing_trigger");
  });

  it("flags a missing end node", () => {
    const g = {
      nodes: [
        { id: "t", type: "manual_trigger", label: "Start" },
        { id: "b", type: "main_brain", label: "Think" },
      ],
      edges: [{ id: "e1", source: "t", target: "b" }],
    };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("graph.missing_end");
  });

  it("flags a dangling edge reference", () => {
    const g = cleanGraph();
    g.edges.push({ id: "bad", source: "b", target: "ghost" });
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("edge.dangling");
  });

  it("detects a cycle", () => {
    const g = {
      nodes: [
        { id: "t", type: "manual_trigger", label: "Start" },
        { id: "a", type: "main_brain", label: "A" },
        { id: "b", type: "condition", label: "B" },
        { id: "e", type: "end", label: "Done" },
      ],
      edges: [
        { id: "e1", source: "t", target: "a" },
        { id: "e2", source: "a", target: "b" },
        { id: "e3", source: "b", target: "a" }, // back-edge -> cycle
        { id: "e4", source: "b", target: "e" },
      ],
    };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("graph.cycle");
  });

  it("detects an unreachable / hidden node", () => {
    const g = cleanGraph();
    // A wait node connected to nothing reachable from the trigger.
    g.nodes.push({ id: "hidden", type: "wait", label: "Lurking" });
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    const unreachable = result.issues.filter((i) => i.code === "node.unreachable");
    expect(unreachable.length).toBe(1);
    expect(unreachable[0].path).toBe("hidden");
  });
});

describe("validateWorkflowGraph — forbidden content in fields", () => {
  it("flags forbidden content in a node label", () => {
    const g = cleanGraph();
    g.nodes[1].label = "import os; os.system('rm -rf /')";
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("forbidden.python");
    expect(codes(result)).toContain("forbidden.shell");
  });

  it("flags forbidden content in a config string value", () => {
    const g = cleanGraph();
    // @ts-expect-error attaching config for the test
    g.nodes[1].config = { prompt: "use api_key sk-ABCDEFGH12345678" };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("forbidden.secret");
  });

  it("flags forbidden content nested in config arrays/objects", () => {
    const g = cleanGraph();
    // @ts-expect-error attaching config for the test
    g.nodes[1].config = { steps: [{ cmd: "curl http://x/tool.exe" }] };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("forbidden.shell");
    expect(codes(result)).toContain("forbidden.executable");
  });

  it("rejects a function in config", () => {
    const g = cleanGraph();
    // @ts-expect-error functions are not JSON-safe
    g.nodes[1].config = { handler: () => 1 };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("config.function");
  });

  it("accepts JSON-primitive config values", () => {
    const g = cleanGraph();
    // @ts-expect-error attaching config for the test
    g.nodes[1].config = { count: 3, enabled: true, note: null, tags: ["a", "b"] };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(true);
  });
});

describe("validateWorkflowGraph — risk rule", () => {
  it("rejects a sensitive action without confirmation AND verification", () => {
    const g = {
      nodes: [
        { id: "t", type: "manual_trigger", label: "Start" },
        { id: "call", type: "call_native_plugin", label: "Send email" },
        { id: "e", type: "end", label: "Done" },
      ],
      edges: [
        { id: "e1", source: "t", target: "call" },
        { id: "e2", source: "call", target: "e" },
      ],
    };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("safety.missing_confirmation");
    expect(codes(result)).toContain("safety.missing_verification");
  });

  it("rejects a sensitive action with confirmation but no verification", () => {
    const g = {
      nodes: [
        { id: "t", type: "manual_trigger", label: "Start" },
        { id: "ask", type: "ask_confirmation", label: "Confirm?" },
        { id: "call", type: "notify_user", label: "Notify" },
        { id: "e", type: "end", label: "Done" },
      ],
      edges: [
        { id: "e1", source: "t", target: "ask" },
        { id: "e2", source: "ask", target: "call" },
        { id: "e3", source: "call", target: "e" },
      ],
    };
    const result = validateWorkflowGraph(g);
    expect(result.ok).toBe(false);
    expect(codes(result)).not.toContain("safety.missing_confirmation");
    expect(codes(result)).toContain("safety.missing_verification");
  });

  it("accepts a sensitive action WITH confirmation and verification", () => {
    const result = validateWorkflowGraph(safeHighRiskGraph());
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("does not require safety nodes for a non-sensitive graph", () => {
    const result = validateWorkflowGraph(cleanGraph());
    expect(codes(result)).not.toContain("safety.missing_confirmation");
    expect(codes(result)).not.toContain("safety.missing_verification");
  });
});
