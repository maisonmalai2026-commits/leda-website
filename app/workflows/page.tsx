import type { Metadata } from "next";
import { MessageSquareText, Sparkles, ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { WorkflowExplorer } from "@/components/workflows/WorkflowExplorer";
import { Reveal } from "@/components/fx/motion";
import { workflows } from "@/lib/content";

export const metadata: Metadata = {
  title: "Workflows",
  description:
    "Browse Leda workflow templates — class reminders, study plans, note summaries and more. Each shows its tools, risk level, and a read-only flow diagram.",
};

export default function WorkflowsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workflow gallery"
        title="Workflows you can read before you run."
        description="Each workflow is a small, reviewable set of steps. See the tools it needs, its risk level, and exactly what it will do."
      />

      <Section>
        <WorkflowExplorer workflows={workflows} />
      </Section>

      {/* PLAIN LANGUAGE SECTION */}
      <Section className="pt-0">
        <Reveal>
          <div className="gradient-border rounded-3xl">
            <Card className="overflow-hidden border-transparent bg-surface/60 p-0">
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="relative overflow-hidden p-8 sm:p-10">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full opacity-40 blur-3xl"
                    style={{ background: "radial-gradient(circle,rgba(45,212,191,0.3),transparent 70%)" }}
                  />
                  <div className="eyebrow relative">
                    <Sparkles size={13} className="text-accent-teal" />
                    Build workflows with plain language
                  </div>
                  <h2 className="relative mt-5 text-balance font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Describe it once. Review the draft.{" "}
                    <span className="text-gradient">Keep what works.</span>
                  </h2>
                  <p className="relative mt-4 text-pretty text-sm leading-relaxed text-ink-muted">
                    You don&apos;t wire up nodes by hand. You tell Leda what you want,
                    and it proposes a workflow using the tools you&apos;ve connected —
                    always as a draft you approve.
                  </p>
                </div>

                {/* mini conversation */}
                <div className="border-t border-white/[0.07] bg-base/40 p-8 sm:p-10 lg:border-l lg:border-t-0">
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="max-w-[90%] rounded-2xl rounded-tr-sm border border-accent-blue/25 bg-accent-blue/[0.12] px-4 py-3 text-sm text-ink shadow-glow-blue">
                        “Every evening, check tomorrow&apos;s classes and help me
                        prepare.”
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue to-accent-teal text-base shadow-glow-teal">
                        <MessageSquareText size={14} />
                      </div>
                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-surface px-4 py-3 text-sm text-ink-muted">
                        Creates a workflow draft using your available tools. You review
                        it before saving.
                        <span className="mt-3 flex items-center gap-1.5 text-xs text-accent-teal">
                          Draft ready <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
