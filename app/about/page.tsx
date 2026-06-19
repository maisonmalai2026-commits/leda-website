import type { Metadata } from "next";
import { Check, Compass, Layers, Brain, Workflow, ShieldCheck } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card, SectionHeading } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Vision",
  description:
    "Leda is an AI workspace that grows with you — bringing AI brains, workflows, and approved tools into one private operating layer, built carefully.",
};

const principles = [
  {
    icon: Layers,
    title: "Not another chatbot wrapper",
    body: "Leda is designed to bring AI brains, workflows, and approved tools into one workspace — not just relay messages to a model.",
  },
  {
    icon: Brain,
    title: "You choose the model",
    body: "Users should be able to pick their preferred AI brain, whether cloud or local, and switch when it makes sense.",
  },
  {
    icon: Workflow,
    title: "Plain-language workflows",
    body: "You should be able to create workflows by describing them — and then read, edit, and trust the result.",
  },
  {
    icon: ShieldCheck,
    title: "Clear permissions, verifiable results",
    body: "Tools should state what they can do, and important actions should be reviewable with evidence where possible.",
  },
];

const timeline = [
  {
    phase: "Now",
    tone: "now" as const,
    items: ["Main chat", "Brain profiles", "Workflow drafts", "Early native tools"],
  },
  {
    phase: "Next",
    tone: "next" as const,
    items: [
      "More trusted integrations",
      "Better workflow execution",
      "Public workflow templates",
    ],
  },
  {
    phase: "Later",
    tone: "later" as const,
    items: ["Community plugins", "Creator profiles", "Plugin marketplace", "Team workspaces"],
  },
];

const toneStyles = {
  now: "border-emerald-400/25 text-emerald-300",
  next: "border-sky-400/25 text-sky-300",
  later: "border-white/[0.12] text-ink-faint",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Vision"
        title="An AI workspace that grows with you."
        description="The long-term goal is a personal — and eventually company — operating layer, built carefully and privately. Here's how we think about it."
      />

      <Section>
        <SectionHeading
          eyebrow="What we're building"
          title="A few principles we won't compromise on."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <Card key={p.title} interactive className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-base/50 text-accent-teal">
                <p.icon size={19} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* TIMELINE */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="Roadmap"
          title="Built in deliberate phases."
          description="An honest view of where Leda is today, what's next, and what we're aiming for later."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {timeline.map((col) => (
            <Card key={col.phase} className="p-6">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${toneStyles[col.tone]}`}
              >
                {col.phase}
              </span>
              <ul className="mt-5 space-y-3">
                {col.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        col.tone === "later" ? "text-ink-faint" : "text-accent-teal"
                      }`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* CLOSING */}
      <Section className="pt-0">
        <Card className="flex flex-col items-start gap-5 border-white/[0.08] bg-surface/60 p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-sky">
            <Compass size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">
              A personal operating layer, built to be trusted.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              We&apos;d rather ship fewer features that are honest and reviewable
              than overpromise. Everything on this site reflects what Leda actually
              does today, or clearly labels what&apos;s still ahead.
            </p>
          </div>
        </Card>
      </Section>
    </>
  );
}
