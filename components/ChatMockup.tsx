import {
  Cpu,
  MessageSquare,
  Workflow,
  Sparkles,
  ShieldCheck,
  Send,
  Check,
} from "lucide-react";

// A code-built mockup of the Leda desktop chat — glass window, glowing conic
// border, floating status chips. Purely illustrative (no real app embedded).
export function ChatMockup() {
  return (
    <div className="relative">
      {/* ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 20%, rgba(56,189,248,0.35), transparent 70%), radial-gradient(60% 60% at 80% 80%, rgba(139,92,246,0.35), transparent 70%)",
        }}
      />

      {/* floating chips */}
      <div className="absolute -left-4 top-12 z-20 hidden animate-float-slow sm:block">
        <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-teal/20 text-accent-teal">
            <Check size={12} />
          </span>
          Verified before sending
        </div>
      </div>
      <div
        className="absolute -right-3 bottom-16 z-20 hidden animate-float-slow sm:block"
        style={{ animationDelay: "-6s" }}
      >
        <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink">
          <Sparkles size={13} className="text-accent-cyan" />
          Draft ready to review
        </div>
      </div>

      <div className="conic-border overflow-hidden rounded-2xl">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0D17]/90 backdrop-blur-xl">
          {/* window chrome */}
          <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-400/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
            <div className="ml-3 flex items-center gap-2 text-xs text-ink-faint">
              <Sparkles size={13} className="text-accent-cyan" />
              Leda workspace
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
            {/* sidebar */}
            <aside className="hidden flex-col gap-4 border-r border-white/[0.07] bg-black/20 p-4 sm:flex">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  Active Brain
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2">
                  <Cpu size={15} className="text-accent-sky" />
                  <span className="text-xs font-medium text-ink">Gemini 2.5 Flash</span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-soft" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  Tools enabled
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2.5 py-1.5 text-xs text-ink-muted">
                    <MessageSquare size={14} className="text-accent-teal" />
                    WhatsApp Agent
                  </li>
                  <li className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2.5 py-1.5 text-xs text-ink-muted">
                    <Workflow size={14} className="text-accent-teal" />
                    Workflow Builder
                  </li>
                </ul>
              </div>
            </aside>

            {/* chat */}
            <div className="flex flex-col p-4 sm:p-5">
              <div className="flex-1 space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-accent-blue/25 bg-accent-blue/[0.12] px-3.5 py-2.5 text-sm text-ink">
                    Build a workflow to prepare reminders for tomorrow&apos;s classes.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-gradient text-[#05060B]">
                    <Sparkles size={14} />
                  </div>
                  <div className="max-w-[88%] space-y-3">
                    <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink-muted">
                      I created a draft workflow using your available tools. Review it
                      before enabling.
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-ink">
                          Draft · Tomorrow&apos;s Class Reminder
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                          Needs review
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-faint">
                        <Step>Read schedule</Step>
                        <Arrow />
                        <Step>Draft reminder</Step>
                        <Arrow />
                        <Step>Show for review</Step>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                        <ShieldCheck size={12} className="text-accent-teal" />
                        Nothing is sent until you approve.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5">
                <span className="flex-1 text-sm text-ink-faint">
                  Describe a task for Leda…
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-gradient text-[#05060B]">
                  <Send size={13} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-ink-muted">
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-accent-cyan/60">→</span>;
}
