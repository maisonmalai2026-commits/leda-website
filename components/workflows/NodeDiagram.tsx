import { Play, ShieldCheck } from "lucide-react";
import type { Workflow } from "@/lib/content";

// Read-only node diagram rendered in pure CSS/SVG. Shows the trigger followed by
// each step as a connected node. Purely illustrative.
export function NodeDiagram({ workflow }: { workflow: Workflow }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-base/40 p-5">
      <ol className="relative space-y-3">
        {/* connecting rail */}
        <span
          aria-hidden
          className="absolute left-[18px] top-4 bottom-4 w-px bg-gradient-to-b from-accent-blue/50 via-accent-teal/40 to-transparent"
        />

        {/* trigger node */}
        <li className="relative flex items-start gap-3">
          <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-blue/30 bg-accent-blue/15 text-accent-sky">
            <Play size={15} />
          </span>
          <div className="flex-1 rounded-xl border border-accent-blue/20 bg-accent-blue/[0.06] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-sky">
              Trigger
            </p>
            <p className="mt-0.5 text-sm text-ink">{workflow.trigger}</p>
          </div>
        </li>

        {/* step nodes */}
        {workflow.steps.map((step, i) => (
          <li key={i} className="relative flex items-start gap-3">
            <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-surface font-mono text-xs text-accent-teal">
              {i + 1}
            </span>
            <div className="flex-1 rounded-xl border border-white/[0.08] bg-surface px-3.5 py-2.5">
              <p className="text-sm text-ink-muted">{step}</p>
            </div>
          </li>
        ))}

        {/* review node */}
        <li className="relative flex items-start gap-3">
          <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-teal/30 bg-accent-teal/15 text-accent-teal">
            <ShieldCheck size={15} />
          </span>
          <div className="flex-1 rounded-xl border border-accent-teal/20 bg-accent-teal/[0.06] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-teal">
              Review
            </p>
            <p className="mt-0.5 text-sm text-ink">
              You see the full result before anything is saved or sent.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
