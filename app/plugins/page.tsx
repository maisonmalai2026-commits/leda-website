import type { Metadata } from "next";
import { Check, X, ShieldCheck, Sparkles } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card, SectionHeading } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { PluginsExplorer } from "@/components/plugins/PluginsExplorer";
import { plugins } from "@/lib/content";

export const metadata: Metadata = {
  title: "Plugins",
  description:
    "Trusted tools for Leda. Browse official and experimental plugins, each with a clear, permission-based summary of what it can and cannot do.",
};

const canDo = [
  "Read selected text input",
  "Create a workflow draft",
  "Send a message only after confirmation",
];

const cannotDo = [
  "Cannot access passwords",
  "Cannot silently install software",
  "Cannot access unrelated files by default",
];

export default function PluginsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trusted tools"
        title="Plugins with clear permissions."
        description="Tools extend what Leda can do — and each one is upfront about what it touches. Official tools are built in; experimental ones are clearly marked."
      />

      <Section>
        <PluginsExplorer plugins={plugins} />
      </Section>

      {/* SAFETY SECTION */}
      <Section className="pt-0">
        <Card className="border-white/[0.08] bg-surface/60 p-8 sm:p-10">
          <div className="flex items-center gap-2 text-accent-teal">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Permission-based by design
            </span>
          </div>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Plugins should be clear about what they can do.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            A good plugin states its scope plainly. Here&apos;s the kind of
            permission summary every Leda tool aims to provide.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5">
              <h3 className="text-sm font-semibold text-emerald-300">Can do</h3>
              <ul className="mt-4 space-y-3">
                {canDo.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-5">
              <h3 className="text-sm font-semibold text-rose-300">Cannot do</h3>
              <ul className="mt-4 space-y-3">
                {cannotDo.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                    <X size={16} className="mt-0.5 shrink-0 text-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Section>

      {/* ROADMAP NOTE */}
      <Section className="pt-0">
        <div className="flex items-start gap-4 rounded-2xl border border-accent-blue/15 bg-accent-blue/[0.05] p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-sky">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">
              A marketplace is on the roadmap.
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Community plugins and marketplace publishing are planned for a later
              phase. Leda will prioritize reviewed, permission-based tools.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
