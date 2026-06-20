import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Puzzle,
  MessageSquareText,
  Eye,
  Check,
  X,
  CalendarClock,
  FileText,
  Mail,
  Workflow,
  ListTodo,
  Wrench,
  Layers,
  Brain,
  ShieldCheck,
  GitBranch,
  Lock,
  Sparkles,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Card, SectionHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ChatMockup } from "@/components/ChatMockup";
import { DownloadButton } from "@/components/DownloadButton";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Magnetic } from "@/components/fx/Magnetic";
import { Marquee } from "@/components/fx/Marquee";
import { OperatingLayerSection } from "@/components/home/OperatingLayerSection";

const brains = [
  "Gemini 2.5 Flash",
  "Claude",
  "OpenAI",
  "Local models",
  "Llama",
  "Mistral",
  "+ more later",
];

const steps = [
  { icon: Cpu, title: "Choose your brain", body: "Gemini, Claude, OpenAI, local models, and more later." },
  { icon: Puzzle, title: "Add trusted tools", body: "Plugins help Leda work with supported apps and workflows." },
  { icon: MessageSquareText, title: "Describe what you need", body: "Leda turns natural language into a workflow draft." },
  { icon: Eye, title: "Review and run", body: "Leda shows what it plans to do before important actions." },
];

const tasks = [
  { icon: CalendarClock, title: "Plan class reminders", soon: false },
  { icon: FileText, title: "Summarize notes", soon: false },
  { icon: Mail, title: "Draft better emails", soon: false },
  { icon: Workflow, title: "Build custom workflows", soon: false },
  { icon: ListTodo, title: "Organize tasks", soon: true },
  { icon: Wrench, title: "Run approved plugin tools", soon: true },
];

const why = [
  { icon: Layers, title: "One workspace, not five apps" },
  { icon: Brain, title: "Choose your own AI brain" },
  { icon: GitBranch, title: "Workflows you can understand" },
  { icon: Puzzle, title: "Plugins with clear permissions" },
  { icon: ShieldCheck, title: "Verification before important actions" },
  { icon: Lock, title: "Private-by-default local workspace" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <Section className="pt-16 sm:pt-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="eyebrow mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-soft" />
            Early desktop prototype for Windows
          </div>
          <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Your AI, connected to{" "}
            <span className="text-gradient">the way you work.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
            Leda brings your AI brain, workflows, and trusted tools into one
            private desktop workspace.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic>
              <DownloadButton label="Preorder Leda" />
            </Magnetic>
            <ButtonLink href="/workflows" variant="secondary" size="lg">
              Explore Workflows
              <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Reveal>

        {/* trusted brains marquee */}
        <Reveal delay={0.15} className="mx-auto mt-12 max-w-3xl">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
            Bring your own brain
          </p>
          <Marquee>
            {brains.map((b, i) => (
              <span
                key={`${b}-${i}`}
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-ink-muted"
              >
                <Sparkles size={13} className="text-accent-cyan" />
                {b}
              </span>
            ))}
          </Marquee>
        </Reveal>

        <Reveal delay={0.2} y={36} className="mx-auto mt-14 max-w-3xl">
          <ChatMockup />
        </Reveal>
      </Section>

      {/* OPERATING LAYER — cartoon body explainer + vision + roadmap */}
      <OperatingLayerSection />

      {/* HOW LEDA WORKS */}
      <Section className="pt-4">
        <Reveal>
          <SectionHeading
            eyebrow="How Leda works"
            title="From a sentence to a workflow you control."
            description="Four clear steps. You stay in charge at every one of them."
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <SpotlightCard className="h-full rounded-2xl">
                <Card interactive className="h-full p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
                      <s.icon size={19} />
                    </div>
                    <span className="font-mono text-xs text-ink-faint">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[15px] font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {s.body}
                  </p>
                </Card>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* BUILT FOR REAL TASKS */}
      <Section className="pt-4">
        <Reveal>
          <SectionHeading
            eyebrow="Built for real tasks"
            title="Everyday work, handled thoughtfully."
            description="Some examples are available now in the prototype; others are on the roadmap and clearly marked."
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <StaggerItem key={t.title}>
              <Card interactive className="flex h-full items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-blue/15 to-accent-cyan/15 text-accent-sky">
                  <t.icon size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium text-ink">{t.title}</h3>
                  {t.soon ? (
                    <span className="mt-1 inline-flex items-center rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                      Coming soon
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      Available now
                    </span>
                  )}
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* WHY LEDA */}
      <Section className="pt-4">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.015] p-8 sm:p-12">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle,rgba(139,92,246,0.4),transparent 70%)" }}
            />
            <SectionHeading
              eyebrow="Why Leda"
              title="A workspace that respects your time and your data."
            />
            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {why.map((w) => (
                <StaggerItem
                  key={w.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 transition-colors hover:border-white/15"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue/25 to-accent-violet/25 text-accent-cyan">
                    <w.icon size={17} />
                  </div>
                  <span className="text-sm font-medium text-ink">{w.title}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </Section>

      {/* COMPARISON */}
      <Section className="pt-4">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="The difference"
            title="More than a chat box."
            description="A normal AI chat answers and forgets. Leda connects your brains and tools, and shows its work."
            className="mx-auto"
          />
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full border-white/[0.06] bg-white/[0.01]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
                Normal AI chat
              </h3>
              <ul className="mt-5 space-y-3">
                {["Answers questions", "Forgets your tools", "Cannot show workflow steps"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-muted">
                    <X size={17} className="mt-0.5 shrink-0 text-rose-400/80" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="gradient-border h-full rounded-2xl">
              <Card className="h-full border-transparent bg-gradient-to-b from-accent-teal/[0.08] to-transparent shadow-glow-teal">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-teal">
                  Leda
                </h3>
                <ul className="mt-5 space-y-3">
                  {[
                    "Connects selected brains and tools",
                    "Creates reusable workflows",
                    "Shows what will happen",
                    "Keeps actions reviewable",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink">
                      <Check size={17} className="mt-0.5 shrink-0 text-accent-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section className="pt-4">
        <Container>
          <Reveal>
            <div className="grain relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0A0D17]/80 px-6 py-16 text-center sm:px-12">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 opacity-70"
                style={{
                  background:
                    "radial-gradient(60% 80% at 50% 0%, rgba(56,189,248,0.22), transparent 60%), radial-gradient(50% 60% at 80% 100%, rgba(139,92,246,0.2), transparent 60%)",
                }}
              />
              <h2 className="font-display text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                Build your first workflow with Leda.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-ink-muted">
                Download the early Windows prototype, or join the waitlist to follow
                along as Leda grows.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic>
                  <DownloadButton />
                </Magnetic>
                <ButtonLink href="/contact" variant="secondary" size="lg">
                  Join the waitlist
                </ButtonLink>
              </div>
              <p className="mt-6 text-xs text-ink-faint">
                Read our{" "}
                <Link href="/privacy" className="text-ink-muted underline-offset-4 hover:underline">
                  privacy &amp; safety approach
                </Link>{" "}
                first — we think you should.
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
