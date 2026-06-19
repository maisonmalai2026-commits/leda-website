import type { Metadata } from "next";
import { Monitor, BookOpen, Cpu, Wifi, Terminal, CheckCircle2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { DownloadButton } from "@/components/DownloadButton";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Get the early Leda desktop prototype for Windows. See system requirements and setup steps. No fake executables — a real public download is coming soon.",
};

const requirements = [
  { icon: Monitor, label: "Windows 10 / 11" },
  { icon: Terminal, label: "Python-based early build" },
  { icon: Wifi, label: "Internet required for cloud AI brains" },
];

const installSteps = [
  "Download Leda",
  "Choose an AI brain",
  "Explore available tools",
  "Build your first workflow",
];

export default function DownloadPage() {
  return (
    <>
      <PageHeader
        eyebrow="Download"
        title="Get the Leda desktop prototype."
        description="Leda is an early prototype. This page shows what's needed to run it and what to expect — we won't ship a fake download."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* main download card */}
          <Card className="p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-sky">
                  <Monitor size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Leda for Windows</h2>
                  <p className="text-sm text-ink-muted">Desktop AI workspace</p>
                </div>
              </div>
              <StatusBadge status="in-development" />
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                Status: Early Prototype
              </span>
            </div>

            <div className="mt-6 hr-soft" />

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                System requirements
              </h3>
              <ul className="mt-4 space-y-3">
                {requirements.map((r) => (
                  <li key={r.label} className="flex items-center gap-3 text-sm text-ink-muted">
                    <r.icon size={17} className="text-accent-teal" />
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <DownloadButton />
              <ButtonLink href="/contact" variant="secondary" size="lg">
                <BookOpen size={16} />
                Get the source setup guide
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink-faint">
              No public installer is available yet. The button above stays
              disabled until there is a real release URL configured.
            </p>
          </Card>

          {/* install steps */}
          <Card className="p-7">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Installation steps
            </h3>
            <ol className="mt-5 space-y-4">
              {installSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-base/50 font-mono text-xs text-accent-teal">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-sm text-ink">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-xl border border-white/[0.07] bg-base/40 p-4">
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
        </div>

        <Card className="mt-6 flex items-start gap-3 border-white/[0.06] bg-surface/40 p-5">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent-teal" />
          <p className="text-sm leading-relaxed text-ink-muted">
            We will only link a download here once there is a signed, real build
            to share. Until then, join the waitlist and we&apos;ll let you know
            the moment it&apos;s ready.
          </p>
        </Card>
      </Section>
    </>
  );
}
