"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Info, Wrench, ShieldCheck } from "lucide-react";
import type { Workflow } from "@/lib/content";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { NodeDiagram } from "@/components/workflows/NodeDiagram";

export function WorkflowExplorer({ workflows }: { workflows: Workflow[] }) {
  const [active, setActive] = useState<Workflow | null>(null);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((w) => (
          <WorkflowCard key={w.slug} workflow={w} onView={() => setActive(w)} />
        ))}
      </div>

      {active ? (
        <WorkflowModal workflow={active} onClose={() => setActive(null)} />
      ) : null}
    </>
  );
}

function WorkflowModal({
  workflow,
  onClose,
}: {
  workflow: Workflow;
  onClose: () => void;
}) {
  const [usedMessage, setUsedMessage] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // lock background scroll while modal is open
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = original;
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/[0.1] bg-surface shadow-glow sm:rounded-3xl">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.07] bg-surface px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={workflow.status} />
              <RiskBadge risk={workflow.risk} />
            </div>
            <h2
              id="workflow-modal-title"
              className="mt-3 text-xl font-semibold text-ink"
            >
              {workflow.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <p className="text-sm leading-relaxed text-ink-muted">
            {workflow.summary}
          </p>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              How it flows
            </h3>
            <NodeDiagram workflow={workflow} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <Wrench size={13} className="text-accent-teal" />
                Required tools
              </h3>
              <ul className="space-y-2">
                {workflow.tools.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-lg border border-white/[0.07] bg-base/40 px-3 py-2 text-sm text-ink"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <ShieldCheck size={13} className="text-accent-teal" />
                Permissions
              </h3>
              <ul className="space-y-2">
                {workflow.permissions.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-ink-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-teal/70" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/[0.08] bg-base/40 p-5">
            <Button onClick={() => setUsedMessage(true)} className="w-full sm:w-auto">
              Use this workflow in Leda
            </Button>
            {usedMessage ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent-blue/20 bg-accent-blue/[0.08] px-4 py-3 text-sm text-ink">
                <Info size={16} className="mt-0.5 shrink-0 text-accent-sky" />
                Open Leda on your computer to use this workflow.
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-faint">
                Desktop integration is still in development. For now, this opens a
                guide rather than launching the app.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
