import { ArrowUpRight, Wrench } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import type { Workflow } from "@/lib/content";

export function WorkflowCard({
  workflow,
  onView,
}: {
  workflow: Workflow;
  onView: () => void;
}) {
  return (
    <Card interactive className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-base/50 px-2.5 py-1 text-xs font-medium text-ink-muted">
          {workflow.category}
        </span>
        <StatusBadge status={workflow.status} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-ink">{workflow.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {workflow.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {workflow.tools.map((tool) => (
          <span
            key={tool}
            className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-base/40 px-2 py-1 text-[11px] text-ink-muted"
          >
            <Wrench size={11} className="text-accent-teal" />
            {tool}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <RiskBadge risk={workflow.risk} />
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-accent-teal transition-colors hover:text-accent-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
        >
          View workflow
          <ArrowUpRight size={15} />
        </button>
      </div>
    </Card>
  );
}
