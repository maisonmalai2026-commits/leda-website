import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ShieldCheck,
  PackageOpen,
  Lock,
  Eye,
  BadgeCheck,
  Users,
  FlaskConical,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Plugin safety — Leda Marketplace",
  description:
    "How tool listings work on the Leda Marketplace: listings are metadata-only, nothing runs automatically, permissions are declared up front, and trust tiers tell you how much review a tool has had.",
  alternates: { canonical: "/marketplace/plugin-safety" },
  openGraph: {
    title: "Plugin safety — Leda Marketplace",
    description:
      "Listings are metadata-only and nothing runs automatically. Here's how the Leda plugin safety model works.",
    url: "/marketplace/plugin-safety",
    type: "website",
  },
};

const PRINCIPLES: { title: string; body: string; Icon: typeof ShieldCheck }[] =
  [
    {
      title: "Listings are metadata-only",
      body: "A tool listing describes a plugin — its purpose, required apps, permissions, and links. The marketplace never ships or stores plugin code, executables, or archives.",
      Icon: PackageOpen,
    },
    {
      title: "Nothing runs automatically",
      body: "Browsing or copying a listing never installs or runs anything on your computer. Built-in Leda tools are the only ones available today; community listings are informational.",
      Icon: Lock,
    },
    {
      title: "Permissions are declared up front",
      body: "Every listing states what it needs and, where relevant, what it cannot access. You see the full permission surface before you ever decide to use a tool.",
      Icon: Eye,
    },
    {
      title: "Trust tiers reflect review",
      body: "Each listing carries a trust badge so you can tell at a glance how much review it has had — from Official and Verified down to Community and Experimental.",
      Icon: ShieldCheck,
    },
  ];

const TRUST_TIERS: {
  label: string;
  description: string;
  box: string;
  Icon: typeof BadgeCheck;
}[] = [
  {
    label: "Official",
    description:
      "Built and maintained by the Leda team. The highest level of review and support.",
    box: "border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
    Icon: BadgeCheck,
  },
  {
    label: "Verified",
    description:
      "From a known creator and reviewed by Leda. Identity and listing have been checked.",
    box: "border-accent-sky/30 bg-accent-sky/10 text-accent-sky",
    Icon: ShieldCheck,
  },
  {
    label: "Community",
    description:
      "Shared by a creator and reviewed for safety. Community code is not automatically installed.",
    box: "border-white/12 bg-white/[0.04] text-ink-muted",
    Icon: Users,
  },
  {
    label: "Experimental",
    description:
      "Early-stage listings. Treat these with extra caution and read the details closely.",
    box: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    Icon: FlaskConical,
  },
];

// Plugin-relevant subset of the community rules, restated for context.
const NEVER_ALLOWED: string[] = [
  "No malware or malicious code",
  "No credential theft",
  "No cookie extraction",
  "No hidden data collection",
  "No crypto wallet or seed-phrase handling",
  "No arbitrary executable uploads",
  "No permission or verification bypass",
];

export default function PluginSafetyPage() {
  return (
    <div className="space-y-12">
      <div>
        <Link
          href="/marketplace/policies"
          className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Marketplace policies
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Plugin safety
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          Leda's plugin model is conservative on purpose. Arbitrary executable
          code is never automatically installed from the marketplace. Here's
          exactly how tool listings work and what protects you.
        </p>
      </div>

      {/* Core principles */}
      <section aria-labelledby="principles-heading">
        <h2 id="principles-heading" className="sr-only">
          Safety principles
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PRINCIPLES.map(({ title, body, Icon }) => (
            <Card key={title} className="flex flex-col gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent-sky"
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust tiers */}
      <section aria-labelledby="tiers-heading">
        <div className="mb-5 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
            Reading the badges
          </p>
          <h2
            id="tiers-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Trust tiers
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            The trust badge on a listing tells you how much review it has had.
          </p>
        </div>
        <Card className="p-0">
          <ul className="divide-y divide-white/[0.06]">
            {TRUST_TIERS.map(({ label, description, box, Icon }) => (
              <li
                key={label}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${box}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {label}
                </span>
                <span className="text-sm leading-relaxed text-ink-muted">
                  {description}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Never allowed */}
      <section aria-labelledby="never-heading">
        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/[0.06] text-rose-300"
              aria-hidden
            >
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="never-heading"
                className="text-base font-semibold text-ink"
              >
                What a listing can never do
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                These are hard limits. Any listing found violating them is
                removed and the creator may be suspended.
              </p>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {NEVER_ALLOWED.map((rule) => (
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
            See the full list in the{" "}
            <Link
              href="/marketplace/policies"
              className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              marketplace policies
            </Link>{" "}
            and learn how to{" "}
            <Link
              href="/marketplace/report"
              className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              report a listing
            </Link>
            .
          </p>
        </Card>
      </section>
    </div>
  );
}
