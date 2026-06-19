import type { Metadata } from "next";
import { Monitor, Cpu, Wifi, Terminal, Clock, Bell, ShieldCheck } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { PreorderForm } from "@/components/PreorderForm";
import { Reveal } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";

export const metadata: Metadata = {
  title: "Preorder",
  description:
    "Leda for Windows is coming soon. Preorder with your email to reserve early access and get notified the moment the desktop build is ready.",
};

const expect = [
  { icon: Monitor, label: "Windows 10 / 11" },
  { icon: Terminal, label: "Python-based early build" },
  { icon: Wifi, label: "Internet required for cloud AI brains" },
];

const dayOne = [
  "Choose your AI brain",
  "Connect trusted tools",
  "Describe a task in plain language",
  "Review the draft, then run it",
];

export default function DownloadPage() {
  return (
    <>
      <PageHeader
        eyebrow="Coming soon"
        title="Leda for Windows is almost here."
        description="The desktop app isn't downloadable yet — we're finishing the early build. Preorder with your email to reserve early access and be first to know when it drops."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* PREORDER — standout card with glowing conic edge */}
          <Reveal className="h-full">
            <div className="conic-border h-full rounded-3xl">
              <Card className="grain relative h-full overflow-hidden rounded-3xl border-transparent bg-[#0A0D17]/85 p-7 shadow-glow-blue sm:p-8">
                <div
                  aria-hidden
                  className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-50 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(56,189,248,0.4), rgba(139,92,246,0.18) 50%, transparent 70%)",
                  }}
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-sky shadow-glow-blue">
                      <Monitor size={22} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-ink">
                        Leda for <span className="text-gradient">Windows</span>
                      </h2>
                      <p className="text-sm text-ink-muted">Desktop AI workspace</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                    <Clock size={12} />
                    Coming soon
                  </span>
                </div>

                <div className="relative mt-7">
                  <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                    <Bell size={16} className="text-accent-cyan" />
                    Preorder early access
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-muted">
                    Drop your email and we&apos;ll send your download link the moment
                    the first Windows build is ready.
                  </p>
                  <div className="mt-5">
                    <PreorderForm />
                  </div>
                </div>

                <div className="relative mt-7 hr-soft" />

                <div className="relative mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-cyan">
                    What you&apos;ll need
                  </h3>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {expect.map((r) => (
                      <li
                        key={r.label}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-sm text-ink-muted transition-colors hover:border-white/15"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-teal">
                          <r.icon size={16} />
                        </span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </Reveal>

          {/* day one */}
          <Reveal delay={0.12} className="h-full">
            <SpotlightCard className="h-full rounded-2xl">
              <Card className="h-full p-7">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-cyan">
                  Your first five minutes
                </h3>
                <ol className="mt-5 space-y-2">
                  {dayOne.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.02]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 font-mono text-xs text-accent-teal">
                        {i + 1}
                      </span>
                      <span className="pt-1 text-sm text-ink">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 rounded-xl border border-white/[0.07] bg-gradient-to-b from-accent-blue/[0.06] to-transparent p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Cpu size={15} className="text-accent-sky" />
                    Bring your own AI brain
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    Leda connects to cloud models with the API key you provide, or to
                    a local model. Your key stays on your machine.
                  </p>
                </div>
              </Card>
            </SpotlightCard>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <Card className="mt-6 flex flex-col items-start gap-4 border-accent-teal/15 bg-gradient-to-br from-accent-teal/[0.05] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-teal/20 bg-accent-teal/10 text-accent-teal">
                <ShieldCheck size={18} />
              </span>
              <p className="pt-1 text-sm leading-relaxed text-ink-muted">
                No payment is taken to preorder — it just reserves your spot. We
                only link a real, signed build here once it&apos;s ready to share.
              </p>
            </div>
            <ButtonLink href="/contact" variant="secondary" className="shrink-0">
              Have a question?
            </ButtonLink>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
