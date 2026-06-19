import type { Metadata } from "next";
import { Check, Compass, Layers, Brain, Workflow, ShieldCheck } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card, SectionHeading } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";

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
  now: {
    chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
    glow: "shadow-glow-teal",
    check: "text-accent-teal",
    accent: "from-emerald-400/[0.06]",
  },
  next: {
    chip: "border-sky-400/30 bg-sky-400/10 text-sky-300",
    dot: "bg-sky-400",
    glow: "shadow-glow-blue",
    check: "text-accent-sky",
    accent: "from-sky-400/[0.06]",
  },
  later: {
    chip: "border-white/[0.14] bg-white/[0.03] text-ink-faint",
    dot: "bg-ink-faint",
    glow: "",
    check: "text-ink-faint",
    accent: "from-white/[0.02]",
  },
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
        <Reveal>
          <SectionHeading
            eyebrow="What we're building"
            title="A few principles we won't compromise on."
          />
        </Reveal>
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <StaggerItem key={p.title}>
              <SpotlightCard className="h-full rounded-2xl">
                <Card interactive className="h-full p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
                    <p.icon size={19} />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.body}</p>
                </Card>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* TIMELINE */}
      <Section className="pt-0">
        <Reveal>
          <SectionHeading
            eyebrow="Roadmap"
            title="Built in deliberate phases."
            description="An honest view of where Leda is today, what's next, and what we're aiming for later."
          />
        </Reveal>
        <Stagger className="mt-10 grid gap-5 lg:grid-cols-3">
          {timeline.map((col) => {
            const t = toneStyles[col.tone];
            return (
              <StaggerItem key={col.phase} className="h-full">
                <Card
                  className={`relative h-full overflow-hidden bg-gradient-to-b ${t.accent} to-transparent p-6 ${t.glow}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${t.chip}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                      {col.phase}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {col.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-ink"
                      >
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${t.check}`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      {/* CLOSING */}
      <Section className="pt-0">
        <Reveal>
          <div className="gradient-border rounded-3xl">
            <Card className="grain relative flex flex-col items-start gap-5 overflow-hidden rounded-3xl border-transparent bg-[#0A0D17]/80 p-8 sm:flex-row sm:items-center sm:p-10">
              <div
                aria-hidden
                className="absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(56,189,248,0.35), rgba(139,92,246,0.18) 50%, transparent 70%)",
                }}
              />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-sky shadow-glow-blue">
                <Compass size={22} />
              </div>
              <div className="relative">
                <h2 className="font-display text-xl font-semibold text-ink">
                  A personal operating layer, built to be{" "}
                  <span className="text-gradient">trusted.</span>
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                  We&apos;d rather ship fewer features that are honest and reviewable
                  than overpromise. Everything on this site reflects what Leda actually
                  does today, or clearly labels what&apos;s still ahead.
                </p>
              </div>
            </Card>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
