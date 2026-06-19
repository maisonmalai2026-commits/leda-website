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
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Card, SectionHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { ChatMockup } from "@/components/ChatMockup";
import { DownloadButton } from "@/components/DownloadButton";

const steps = [
  {
    icon: Cpu,
    title: "Choose your brain",
    body: "Gemini, Claude, OpenAI, local models, and more later.",
  },
  {
    icon: Puzzle,
    title: "Add trusted tools",
    body: "Plugins help Leda work with supported apps and workflows.",
  },
  {
    icon: MessageSquareText,
    title: "Describe what you need",
    body: "Leda turns natural language into a workflow draft.",
  },
  {
    icon: Eye,
    title: "Review and run",
    body: "Leda shows what it plans to do before important actions.",
  },
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
      <Section className="pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Pill className="mx-auto animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" />
            Early desktop prototype for Windows
          </Pill>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Your AI, connected to{" "}
            <span className="text-gradient">the way you work.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
            Leda brings your AI brain, workflows, and trusted tools into one
            private desktop workspace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DownloadButton label="Download Leda" />
            <ButtonLink href="/workflows" variant="secondary" size="lg">
              Explore Workflows
              <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          <ChatMockup />
        </div>
      </Section>

      {/* HOW LEDA WORKS */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="How Leda works"
          title="From a sentence to a workflow you control."
          description="Four clear steps. You stay in charge at every one of them."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} interactive className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-base/50 text-accent-teal">
                  <s.icon size={18} />
                </div>
                <span className="font-mono text-xs text-ink-faint">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {s.body}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* BUILT FOR REAL TASKS */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="Built for real tasks"
          title="Everyday work, handled thoughtfully."
          description="Some examples are available now in the prototype; others are on the roadmap and clearly marked."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <Card key={t.title} interactive className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-base/50 text-accent-sky">
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
          ))}
        </div>
      </Section>

      {/* WHY LEDA */}
      <Section className="pt-0">
        <div className="rounded-3xl border border-white/[0.08] bg-surface/60 p-8 sm:p-12">
          <SectionHeading
            eyebrow="Why Leda"
            title="A workspace that respects your time and your data."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((w) => (
              <div
                key={w.title}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-base/40 px-4 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-teal">
                  <w.icon size={17} />
                </div>
                <span className="text-sm font-medium text-ink">{w.title}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* COMPARISON */}
      <Section className="pt-0">
        <SectionHeading
          align="center"
          eyebrow="The difference"
          title="More than a chat box."
          description="A normal AI chat answers and forgets. Leda connects your brains and tools, and shows its work."
          className="mx-auto"
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Card className="border-white/[0.06] bg-surface/40">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Normal AI chat
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                "Answers questions",
                "Forgets your tools",
                "Cannot show workflow steps",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-muted">
                  <X size={17} className="mt-0.5 shrink-0 text-rose-400/80" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-accent-teal/20 bg-gradient-to-b from-accent-teal/[0.06] to-transparent">
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
      </Section>

      {/* FINAL CTA */}
      <Section className="pt-0">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-surface px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.18), transparent 55%)",
              }}
            />
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Build your first workflow with Leda.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-ink-muted">
              Download the early Windows prototype, or join the waitlist to follow
              along as Leda grows.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DownloadButton />
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Join the waitlist
              </ButtonLink>
            </div>
            <p className="mt-5 text-xs text-ink-faint">
              Read our{" "}
              <Link href="/privacy" className="text-ink-muted underline-offset-4 hover:underline">
                privacy &amp; safety approach
              </Link>{" "}
              first — we think you should.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
