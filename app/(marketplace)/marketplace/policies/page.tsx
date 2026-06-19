import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  Flag,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { COMMUNITY_RULES } from "@/lib/marketplace/policies";

export const metadata: Metadata = {
  title: "Marketplace policies — Leda Marketplace",
  description:
    "The rules that keep the Leda Marketplace safe: what creators can publish, how plugin listings are handled, how to report content, and the community rules every submission must follow.",
  alternates: { canonical: "/marketplace/policies" },
  openGraph: {
    title: "Marketplace policies — Leda Marketplace",
    description:
      "The rules that keep the Leda Marketplace safe for creators and users.",
    url: "/marketplace/policies",
    type: "website",
  },
};

const HUB_LINKS: {
  href: string;
  title: string;
  description: string;
  Icon: typeof BookOpen;
}[] = [
  {
    href: "/marketplace/creator-guidelines",
    title: "Creator guidelines",
    description:
      "What you can publish, how review works, and how to keep your listings in good standing.",
    Icon: BookOpen,
  },
  {
    href: "/marketplace/plugin-safety",
    title: "Plugin safety",
    description:
      "How tool listings work, what they can and cannot access, and why nothing runs automatically.",
    Icon: ShieldCheck,
  },
  {
    href: "/marketplace/report",
    title: "Report content",
    description:
      "Found something that breaks the rules? Here's how to flag it for human review.",
    Icon: Flag,
  },
];

export default function PoliciesPage() {
  return (
    <div className="space-y-12">
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Marketplace
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Marketplace policies
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          The Leda Marketplace is built to be safe by default. Workflows are
          declarative templates you review before enabling, and tool listings
          are metadata-only. These policies explain what we accept, how review
          works, and the rules every submission must follow.
        </p>
      </div>

      {/* Hub links */}
      <section aria-labelledby="policy-hub-heading">
        <h2 id="policy-hub-heading" className="sr-only">
          Policy pages
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {HUB_LINKS.map(({ href, title, description, Icon }) => (
            <Card
              key={href}
              interactive
              className="group relative flex h-full flex-col gap-3 p-5"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent-sky"
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-ink">
                <Link
                  href={href}
                  className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                >
                  {title}
                </Link>
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {description}
              </p>
              <span
                className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-medium text-accent-sky transition-transform group-hover:translate-x-0.5"
                aria-hidden
              >
                Read more
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* Community rules */}
      <section aria-labelledby="community-rules-heading">
        <div className="mb-5 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
            The hard line
          </p>
          <h2
            id="community-rules-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Community rules
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            These apply to every workflow, tool listing, review, and profile.
            Content that breaks any of them is rejected or removed, and repeated
            violations can suspend a creator account.
          </p>
        </div>
        <Card className="p-0">
          <ul className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0">
            {COMMUNITY_RULES.map((rule, i) => (
              <li
                key={rule}
                className={cn(
                  "flex items-start gap-2.5 px-5 py-3.5 text-sm text-ink-muted",
                  // Add column dividers on sm+ for a clean two-up grid.
                  "sm:border-b sm:border-white/[0.06]",
                  i % 2 === 0 ? "sm:border-r" : "",
                )}
              >
                <XCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/80"
                  aria-hidden
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Card>
        <p className="mt-4 text-sm leading-relaxed text-ink-faint">
          See something that breaks these rules?{" "}
          <Link
            href="/marketplace/report"
            className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
          >
            Report it
          </Link>{" "}
          and a human moderator will review it.
        </p>
      </section>
    </div>
  );
}
