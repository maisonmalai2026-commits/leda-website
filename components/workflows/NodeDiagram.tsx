import { Play, ShieldCheck } from "lucide-react";
import type { Workflow } from "@/lib/content";

// Read-only node diagram rendered in pure CSS/SVG. Shows the trigger followed by
// each step as a connected node. Purely illustrative.
export function NodeDiagram({ workflow }: { workflow: Workflow }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-base/40 p-5">
      <div
        aria-hidden
        className="absolute -left-16 top-0 h-40 w-40 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle,rgba(59,130,246,0.25),transparent 70%)" }}
      />
      <ol className="relative space-y-3">
        {/* connecting rail */}
        <span
          aria-hidden
          className="absolute left-[18px] top-4 bottom-4 w-[2px] rounded-full bg-gradient-to-b from-accent-blue via-accent-teal to-transparent shadow-[0_0_12px_rgba(45,212,191,0.45)]"
        />

        {/* trigger node */}
        <li className="relative flex items-start gap-3">
          <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-blue/40 bg-gradient-to-br from-accent-blue/25 to-accent-sky/15 text-accent-sky shadow-glow-blue">
            <Play size={15} />
          </span>
          <div className="flex-1 rounded-xl border border-accent-blue/25 bg-accent-blue/[0.08] px-3.5 py-2.5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-sky">
              Trigger
            </p>
            <p className="mt-0.5 text-sm text-ink">{workflow.trigger}</p>
          </div>
        </li>

        {/* step nodes */}
        {workflow.steps.map((step, i) => (
          <li key={i} className="relative flex items-start gap-3">
            <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-surface-high/80 font-mono text-xs text-accent-teal backdrop-blur-sm">
              {i + 1}
            </span>
            <div className="flex-1 rounded-xl border border-white/[0.08] bg-surface/80 px-3.5 py-2.5 backdrop-blur-sm">
              <p className="text-sm text-ink-muted">{step}</p>
            </div>
          </li>
        ))}

        {/* review node */}
        <li className="relative flex items-start gap-3">
          <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-teal/40 bg-gradient-to-br from-accent-teal/25 to-accent-cyan/15 text-accent-teal shadow-glow-teal">
            <ShieldCheck size={15} />
          </span>
          <div className="flex-1 rounded-xl border border-accent-teal/25 bg-accent-teal/[0.08] px-3.5 py-2.5 backdrop-blur-sm">
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
