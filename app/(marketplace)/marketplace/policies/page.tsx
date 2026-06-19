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
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";

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
    <div className="space-y-14">
      <Reveal>
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -left-16 -top-24 h-60 w-[36rem] rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(45,212,191,0.26), rgba(56,189,248,0.16) 55%, transparent 72%)",
            }}
          />
          <div className="relative max-w-2xl">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Marketplace
            </Link>
            <div className="mt-5">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-soft" />
                Safe by default
              </span>
            </div>
            <h1 className="mt-5 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              Marketplace <span className="text-gradient">policies</span>
            </h1>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-base">
              The Leda Marketplace is built to be safe by default. Workflows are
              declarative templates you review before enabling, and tool
              listings are metadata-only. These policies explain what we accept,
              how review works, and the rules every submission must follow.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Hub links */}
      <section aria-labelledby="policy-hub-heading">
        <h2 id="policy-hub-heading" className="sr-only">
          Policy pages
        </h2>
        <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {HUB_LINKS.map(({ href, title, description, Icon }) => (
            <StaggerItem key={href} className="flex">
              <SpotlightCard className="h-full w-full rounded-2xl">
                <Card
                  interactive
                  className="group relative flex h-full flex-col gap-3 p-5"
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-ink">
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
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Community rules */}
      <section aria-labelledby="community-rules-heading">
        <Reveal>
          <div className="mb-6 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
              The hard line
            </p>
            <h2
              id="community-rules-heading"
              className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            >
              Community rules
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              These apply to every workflow, tool listing, review, and profile.
              Content that breaks any of them is rejected or removed, and
              repeated violations can suspend a creator account.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="overflow-hidden p-0">
            <ul className="grid grid-cols-1 sm:grid-cols-2">
              {COMMUNITY_RULES.map((rule, i) => (
                <li
                  key={rule}
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 text-sm text-ink-muted transition-colors hover:bg-white/[0.02]",
                    "border-b border-white/[0.06]",
                    // Column divider on sm+ for a clean two-up grid.
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
        </Reveal>
        <p className="mt-5 text-sm leading-relaxed text-ink-faint">
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
