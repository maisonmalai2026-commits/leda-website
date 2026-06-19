import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  Flag,
  MousePointerClick,
  ClipboardCheck,
  ShieldAlert,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ReportButton } from "@/components/marketplace/ReportButton";
import { Reveal } from "@/components/fx/motion";

export const metadata: Metadata = {
  title: "Report content — Leda Marketplace",
  description:
    "How to report a workflow, tool listing, profile, or review on the Leda Marketplace. Every report is reviewed by a human moderator.",
  alternates: { canonical: "/marketplace/report" },
  openGraph: {
    title: "Report content — Leda Marketplace",
    description:
      "How to report content on the Leda Marketplace. Every report is reviewed by a human moderator.",
    url: "/marketplace/report",
    type: "website",
  },
};

// The official Leda profile is the moderation contact target for a general
// safety concern that isn't tied to a single listing. Reporting in-context
// (from a specific listing's page) is always preferred.
const MODERATION_CONTACT_ID = "prof_leda_official";

const STEPS: { title: string; body: string; Icon: typeof MousePointerClick }[] =
  [
    {
      title: "Open the item",
      body: "Go to the workflow, tool listing, profile, or review you're concerned about.",
      Icon: MousePointerClick,
    },
    {
      title: "Use the Report button",
      body: "Every listing and profile has a Report button. Choose a reason and add any context that helps us review faster.",
      Icon: Flag,
    },
    {
      title: "A human reviews it",
      body: "Reports go to our moderation team — never auto-actioned. We may remove content, request changes, or follow up.",
      Icon: ClipboardCheck,
    },
  ];

const REASONS: string[] = [
  "Spam or misleading content",
  "Malicious or unsafe content",
  "Inappropriate content",
  "Copyright or trademark issue",
  "Impersonation",
  "Something else",
];

export default function ReportPage() {
  return (
    <div className="space-y-14">
      <Reveal>
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -left-16 -top-24 h-60 w-[36rem] rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(251,191,36,0.18), rgba(56,189,248,0.16) 55%, transparent 72%)",
            }}
          />
          <div className="relative max-w-2xl">
            <Link
              href="/marketplace/policies"
              className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Marketplace policies
            </Link>
            <div className="mt-5">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-soft" />
                Human moderation
              </span>
            </div>
            <h1 className="mt-5 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              Report <span className="text-gradient">content</span>
            </h1>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-base">
              Help keep the Leda Marketplace safe. If a workflow, tool listing,
              profile, or review breaks our{" "}
              <Link
                href="/marketplace/policies"
                className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
              >
                community rules
              </Link>
              , report it and a human moderator will review it.
            </p>
          </div>
        </div>
      </Reveal>

      {/* How reporting works */}
      <section aria-labelledby="how-heading">
        <Reveal>
          <h2
            id="how-heading"
            className="mb-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            How reporting works
          </h2>
        </Reveal>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map(({ title, body, Icon }, i) => (
            <li key={title}>
              <Reveal delay={i * 0.08} className="h-full">
                <Card className="flex h-full flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 font-mono text-sm font-semibold text-accent-cyan"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-ink-faint" aria-hidden />
                  </div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {body}
                  </p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* What you can report for */}
      <section aria-labelledby="reasons-heading">
        <Reveal>
          <h2
            id="reasons-heading"
            className="mb-5 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl"
          >
            What you can report for
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {REASONS.map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-white/20 hover:text-ink"
              >
                {reason}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* General safety concern */}
      <section aria-labelledby="general-heading">
        <Reveal>
        <Card className="flex flex-col gap-4 border-amber-400/15 bg-amber-400/[0.02]">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
              aria-hidden
            >
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="general-heading"
                className="font-display text-base font-semibold text-ink"
              >
                Have a general safety concern?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                For the fastest review, report from the specific item's page so
                we know exactly what you mean. If your concern isn't tied to a
                single listing, you can flag it to the moderation team here.
              </p>
            </div>
          </div>
          <div>
            <ReportButton
              targetType="profile"
              targetId={MODERATION_CONTACT_ID}
            />
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
              Sign in with a demo identity to open the report dialog. Reports are
              reviewed by a human — nothing is auto-actioned.
            </p>
          </div>
        </Card>
        </Reveal>
      </section>
    </div>
  );
}
