import {
  MessageSquareText,
  GitBranch,
  PlayCircle,
  Building2,
  Monitor,
  Chrome,
  Smartphone,
  Cloud,
  Cpu,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { OperatingBrain } from "@/components/home/OperatingBrain";

const flow = [
  { icon: MessageSquareText, title: "You type a goal", body: "“Prepare reminders for tomorrow’s classes.” Plain language — no setup." },
  { icon: GitBranch, title: "Leda drafts a workflow", body: "It turns your sentence into clear, reviewable steps using your tools." },
  { icon: PlayCircle, title: "You review & run", body: "Read it, tweak it, approve it. Important actions always ask first." },
];

const brains = [
  "Claude",
  "ChatGPT",
  "Gemini",
  "Llama (local / offline)",
  "Mistral",
];

const roadmap = [
  { icon: Monitor, label: "Windows desktop", status: "Early access" },
  { icon: Chrome, label: "Chrome extension", status: "Coming soon" },
  { icon: Smartphone, label: "Mobile app", status: "Coming soon" },
  { icon: Cloud, label: "Leda in the cloud", status: "Coming soon" },
];

export function OperatingLayerSection() {
  return (
    <Section className="pt-4" id="how-it-works">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Meet your AI operating layer."
          description="Picture Leda as a body you steer with a single sentence. The head is the AI brain you choose. The hands are the workers that do the tasks. You give it a goal — it builds the workflow."
          className="mx-auto"
        />
      </Reveal>

      {/* Interactive figure */}
      <Reveal delay={0.1} className="mt-14">
        <OperatingBrain />
      </Reveal>

      {/* prompt -> workflow -> run */}
      <Reveal className="mt-16">
        <SectionHeading
          eyebrow="From a single prompt"
          title="A sentence in. A workflow out."
        />
      </Reveal>
      <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
        {flow.map((s, i) => (
          <StaggerItem key={s.title}>
            <Card interactive className="h-full p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
                  <s.icon size={19} />
                </span>
                <span className="font-mono text-xs text-ink-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Vision: company operating brain */}
      <Reveal className="mt-16">
        <div className="conic-border rounded-3xl">
          <Card className="grain relative overflow-hidden rounded-3xl border-transparent bg-[#0A0D17]/85 p-8 sm:p-12">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(139,92,246,0.4), rgba(56,189,248,0.18) 50%, transparent 70%)",
              }}
            />
            <div className="relative max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-violet/30 bg-accent-violet/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent-violet">
                <Building2 size={13} />
                Our north star · in development
              </span>
              <h2 className="mt-5 text-balance font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl">
                The goal: become your company&apos;s{" "}
                <span className="text-gradient">operating brain.</span>
              </h2>
              <p className="mt-4 text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-base">
                Where we&apos;re headed: Leda installs into a company and becomes the
                brain that coordinates the operational work across it — connected,
                with permission, to the tools and data you choose, and able to draft
                and run the workflows that keep things moving. Always reviewable,
                always with humans in the loop. We&apos;re early, and we&apos;ll only
                claim each capability once it&apos;s real.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  "Drafts & runs operational workflows from a prompt",
                  "Coordinates across the apps you connect",
                  "Sensitive actions stay reviewable by a human",
                ].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-ink"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Reveal>

      {/* Y Combinator reference */}
      <Reveal className="mt-6">
        <Card className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-accent-blue/15 to-accent-violet/15 text-accent-sky">
              <Lightbulb size={24} />
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-ink">
              The same idea the best founders are chasing.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Y Combinator&apos;s public{" "}
              <span className="text-ink">Requests for Startups</span> names a
              company-wide AI &ldquo;brain&rdquo; among the ideas it most wants
              founders to build. Leda is our take on exactly that — only
              upgraded: <span className="text-ink">bring-your-own-AI</span> (never
              locked to one model) and <span className="text-ink">human review</span>{" "}
              built into every important action.
            </p>
            <p className="mt-3 text-xs text-ink-faint">
              Reference only — Leda is independent and is not affiliated with, sponsored by, or endorsed by Y Combinator.
            </p>
          </div>
        </Card>
      </Reveal>

      {/* Bring your own brain */}
      <Reveal className="mt-6">
        <Card className="p-7 sm:p-8">
          <div className="flex items-center gap-2 text-accent-cyan">
            <Cpu size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Never locked to one AI
            </span>
          </div>
          <h3 className="mt-4 text-balance font-display text-xl font-semibold text-ink sm:text-2xl">
            Leda has no AI of its own — so it can use the{" "}
            <span className="text-gradient">best one available.</span>
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            As Anthropic, OpenAI and others ship more powerful models, you just
            point Leda at the new one. Prefer to stay private? Run a local,
            offline model like Llama. Your choice, swappable anytime.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {brains.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-ink-muted"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" />
                {b}
              </span>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* Roadmap: where Leda will run */}
      <Reveal className="mt-6">
        <SectionHeading eyebrow="Coming to more places" title="Wherever you work, soon." />
      </Reveal>
      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roadmap.map((r) => {
          const live = r.status === "Early access";
          return (
            <StaggerItem key={r.label}>
              <Card interactive className="flex h-full flex-col items-start gap-3 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-blue/15 to-accent-cyan/15 text-accent-sky">
                  <r.icon size={19} />
                </span>
                <h3 className="font-display text-[15px] font-semibold text-ink">{r.label}</h3>
                <span
                  className={
                    live
                      ? "inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                      : "inline-flex items-center rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[11px] font-medium text-sky-300"
                  }
                >
                  {r.status}
                </span>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal className="mt-8 text-center">
        <p className="text-sm text-ink-muted">
          This is where Leda is heading.{" "}
          <a href="/about" className="text-accent-cyan underline-offset-4 hover:underline">
            See the full vision &amp; roadmap
          </a>
          <ArrowRight size={14} className="ml-1 inline" />
        </p>
      </Reveal>
    </Section>
  );
}
