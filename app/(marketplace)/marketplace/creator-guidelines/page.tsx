import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { COMMUNITY_RULES } from "@/lib/marketplace/policies";

export const metadata: Metadata = {
  title: "Creator guidelines — Leda Marketplace",
  description:
    "How to publish great workflow templates and tool listings on the Leda Marketplace: what's allowed, how human review works, and how to keep your listings in good standing.",
  alternates: { canonical: "/marketplace/creator-guidelines" },
  openGraph: {
    title: "Creator guidelines — Leda Marketplace",
    description:
      "How to publish workflow templates and tool listings on the Leda Marketplace.",
    url: "/marketplace/creator-guidelines",
    type: "website",
  },
};

const DO_ITEMS: string[] = [
  "Publish declarative workflow templates built from Leda's supported node types.",
  "Write a clear title and description that honestly states what the workflow does.",
  "Declare every required tool and permission your workflow uses.",
  "Set an accurate risk level and skill level so users know what to expect.",
  "Keep tool listings metadata-only: link to your source, docs, and support.",
  "Respond to review feedback and update your version changelog when you ship changes.",
];

const DONT_ITEMS: string[] = [
  "Don't embed code, scripts, executables, or archives in a workflow or listing.",
  "Don't request permissions your workflow doesn't actually need.",
  "Don't publish deceptive workflows that do something other than they claim.",
  "Don't collect, exfiltrate, or hide handling of personal data or credentials.",
  "Don't post fake reviews, fake metrics, impersonate others, or violate copyright.",
  "Don't attempt to bypass review, verification, or Leda's permission prompts.",
];

const REVIEW_STEPS: { title: string; body: string }[] = [
  {
    title: "Draft",
    body: "Build your workflow template or tool listing in the creator dashboard. Validation runs before you can submit.",
  },
  {
    title: "Submit for review",
    body: "Submitting moves your content to a pending state. Nothing is published automatically — a human reviews every submission.",
  },
  {
    title: "Human review",
    body: "We check for safety, accuracy of declared permissions, and policy compliance. We may approve, request changes, or reject with a reason.",
  },
  {
    title: "Published & versioned",
    body: "Approved content goes live with a trust badge. Future updates ship as new versions with a changelog so users can see what changed.",
  },
];

function PolicyHeader() {
  return (
    <div>
      <Link
        href="/marketplace/policies"
        className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Marketplace policies
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Creator guidelines
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        Leda Marketplace rewards creators who publish workflows and tools that
        are safe, honest, and genuinely useful. These guidelines explain what we
        accept and how review works, so your submissions sail through.
      </p>
    </div>
  );
}

export default function CreatorGuidelinesPage() {
  return (
    <div className="space-y-12">
      <PolicyHeader />

      {/* Do / Don't */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 border-emerald-400/15 bg-emerald-400/[0.03]">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden />
            Do
          </h2>
          <ul className="space-y-3">
            {DO_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-muted"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-4 border-rose-400/15 bg-rose-400/[0.03]">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <XCircle className="h-5 w-5 text-rose-300" aria-hidden />
            Don't
          </h2>
          <ul className="space-y-3">
            {DONT_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-muted"
              >
                <XCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/80"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Review process */}
      <section aria-labelledby="review-heading">
        <div className="mb-5 max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
            <ClipboardCheck className="h-4 w-4" aria-hidden />
            How review works
          </p>
          <h2
            id="review-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Every submission is reviewed by a human
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            There is no automatic approval. Validation runs first to catch
            structural issues, then a person reviews for safety and accuracy.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="flex h-full flex-col gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-sm font-semibold text-accent-sky"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Community rules reminder */}
      <section aria-labelledby="rules-reminder-heading">
        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent-teal"
              aria-hidden
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="rules-reminder-heading"
                className="text-base font-semibold text-ink"
              >
                The community rules apply to everything you publish
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Breaking any of these will get your content rejected or removed.
              </p>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {COMMUNITY_RULES.map((rule) => (
              <li
                key={rule}
                className="flex items-start gap-2 text-sm text-ink-muted"
              >
                <XCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/70"
                  aria-hidden
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-faint">
            Read the full{" "}
            <Link
              href="/marketplace/policies"
              className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              marketplace policies
            </Link>{" "}
            and the{" "}
            <Link
              href="/marketplace/plugin-safety"
              className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              plugin safety model
            </Link>
            .
          </p>
        </Card>
      </section>

      {/* CTA */}
      <section>
        <Card className="flex flex-col items-start justify-between gap-5 bg-gradient-to-br from-accent-blue/[0.10] to-transparent sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-ink">
              Ready to publish?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Start a draft in the creator dashboard. We'll validate it and walk
              you through review.
            </p>
          </div>
          <ButtonLink
            href="/creator/dashboard"
            variant="primary"
            className="shrink-0"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Open creator dashboard
          </ButtonLink>
        </Card>
      </section>
    </div>
  );
}
