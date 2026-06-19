import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Workflow,
  Puzzle,
  Users,
  Tag,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  getFeaturedWorkflows,
  getFeaturedPlugins,
  getTrendingCreators,
  listCategories,
} from "@/lib/marketplace/data";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { WorkflowCard } from "@/components/marketplace/WorkflowCard";
import { PluginCard } from "@/components/marketplace/PluginCard";
import { CreatorCard } from "@/components/marketplace/CreatorCard";
import { HomeSearch } from "@/components/marketplace/HomeSearch";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Magnetic } from "@/components/fx/Magnetic";

export const metadata: Metadata = {
  title: "Leda Marketplace — Build once. Share what works.",
  description:
    "Discover workflows and trusted tools made for Leda. Browse safe, reviewed automation templates and tool listings — copy them into your private Leda workspace.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Leda Marketplace — Build once. Share what works.",
    description:
      "Discover workflows and trusted tools made for Leda. Browse safe, reviewed automation templates and tool listings.",
    url: "/marketplace",
    type: "website",
  },
};

// ---------------------------------------------------------------------------
// Status legend — mirrors the trust/moderation vocabulary used across the
// marketplace so visitors can read the badges they'll see on every card.
// ---------------------------------------------------------------------------

const LEGEND: {
  label: string;
  description: string;
  box: string;
  dot: string;
}[] = [
  {
    label: "Official",
    description: "Built and maintained by the Leda team.",
    box: "border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
    dot: "bg-accent-teal",
  },
  {
    label: "Verified",
    description: "Reviewed by Leda from a known creator.",
    box: "border-accent-sky/30 bg-accent-sky/10 text-accent-sky",
    dot: "bg-accent-sky",
  },
  {
    label: "Community",
    description: "Shared by a creator; listing reviewed for safety.",
    box: "border-white/12 bg-white/[0.04] text-ink-muted",
    dot: "bg-ink-faint",
  },
  {
    label: "Experimental",
    description: "Early-stage; use with extra care.",
    box: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-300",
  },
  {
    label: "Coming soon",
    description: "Announced but not yet available.",
    box: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    dot: "bg-violet-300",
  },
];

function SectionHead({
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">
            <span className="h-1 w-6 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-balance font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {href && cta ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm font-medium text-accent-sky transition-colors hover:border-accent-sky/40 hover:bg-accent-sky/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
        >
          {cta}
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      ) : null}
    </Reveal>
  );
}

export default async function MarketplaceHomePage() {
  const flags = getMarketplaceFlags();
  const [featuredWorkflows, featuredPlugins, categories, trendingCreators] =
    await Promise.all([
      getFeaturedWorkflows(),
      getFeaturedPlugins(),
      listCategories(),
      getTrendingCreators(),
    ]);

  const topCreators = trendingCreators.slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Hero */}
      <Reveal as="section" y={28}>
        <div className="conic-border rounded-3xl">
          <div className="grain relative overflow-hidden rounded-3xl bg-[#0A0D17]/80 px-6 py-12 sm:px-10 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-80"
              style={{
                background:
                  "radial-gradient(60% 80% at 85% 0%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(50% 70% at 5% 100%, rgba(139,92,246,0.16), transparent 60%)",
              }}
            />
            <div className="relative max-w-3xl">
              <p className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-soft" />
                Leda Marketplace
              </p>
              <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                Build once.{" "}
                <span className="text-gradient">Share what works.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
                Discover workflows and trusted tools made for Leda.
              </p>

              <div className="mt-8 max-w-xl">
                <HomeSearch />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <ButtonLink href="/marketplace/workflows" variant="primary">
                    <Workflow className="h-4 w-4" aria-hidden />
                    Browse workflows
                  </ButtonLink>
                </Magnetic>
                <ButtonLink href="/marketplace/plugins" variant="secondary">
                  <Puzzle className="h-4 w-4" aria-hidden />
                  Browse tools
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Safety message */}
      <Reveal as="section">
        <Card className="relative flex flex-col gap-4 overflow-hidden border-accent-teal/20 bg-accent-teal/[0.04] shadow-glow-teal sm:flex-row sm:items-start sm:gap-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-teal/10 blur-3xl"
          />
          <span
            className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-teal/25 bg-gradient-to-br from-accent-teal/20 to-accent-cyan/10 text-accent-teal"
            aria-hidden
          >
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="relative min-w-0">
            <h2 className="font-display text-base font-semibold text-ink">
              Safe by design
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Leda Marketplace accepts safe workflow templates and reviewed tool
              listings. Arbitrary executable code is not automatically installed.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
              Workflows are declarative templates you copy into your private
              workspace and review before enabling. Tool listings are
              metadata-only — read the{" "}
              <Link
                href="/marketplace/plugin-safety"
                className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
              >
                plugin safety model
              </Link>{" "}
              and{" "}
              <Link
                href="/marketplace/policies"
                className="font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
              >
                marketplace policies
              </Link>
              .
            </p>
          </div>
        </Card>
      </Reveal>

      {/* Featured workflows */}
      <section>
        <SectionHead
          eyebrow="Featured"
          title="Workflows worth copying"
          description="Editor's picks you can copy into your private Leda workspace and review before enabling."
          href="/marketplace/workflows"
          cta="All workflows"
        />
        {featuredWorkflows.length > 0 ? (
          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredWorkflows.map((workflow) => (
              <StaggerItem key={workflow.id}>
                <SpotlightCard className="h-full rounded-2xl">
                  <WorkflowCard workflow={workflow} flags={flags} />
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            icon={Workflow}
            title="No featured workflows yet"
            description="Check back soon, or browse the full gallery."
            action={
              <ButtonLink href="/marketplace/workflows" variant="secondary">
                Browse workflows
              </ButtonLink>
            }
          />
        )}
      </section>

      {/* Featured plugin listings */}
      <section>
        <SectionHead
          eyebrow="Featured"
          title="Trusted tool listings"
          description="Reviewed tool listings that workflows can call. Listings are metadata-only today."
          href="/marketplace/plugins"
          cta="All tools"
        />
        {featuredPlugins.length > 0 ? (
          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPlugins.map((plugin) => (
              <StaggerItem key={plugin.id}>
                <SpotlightCard className="h-full rounded-2xl">
                  <PluginCard plugin={plugin} flags={flags} />
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            icon={Puzzle}
            title="No featured tools yet"
            description="Check back soon, or browse the full gallery."
            action={
              <ButtonLink href="/marketplace/plugins" variant="secondary">
                Browse tools
              </ButtonLink>
            }
          />
        )}
      </section>

      {/* Popular categories */}
      <section>
        <SectionHead
          eyebrow="Browse by topic"
          title="Popular categories"
        />
        {categories.length > 0 ? (
          <Reveal className="flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/marketplace/categories/${category.slug}`}
                className={cn(
                  "group inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-ink-muted",
                  "transition-all hover:-translate-y-0.5 hover:border-accent-cyan/30 hover:bg-accent-cyan/[0.06] hover:text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                )}
              >
                <Tag
                  className="h-3.5 w-3.5 text-ink-faint transition-colors group-hover:text-accent-cyan"
                  aria-hidden
                />
                {category.name}
              </Link>
            ))}
          </Reveal>
        ) : (
          <p className="text-sm text-ink-muted">No categories available yet.</p>
        )}
      </section>

      {/* Trending creators */}
      <section>
        <SectionHead
          eyebrow="People to follow"
          title="Trending creators"
          description="Makers sharing public workflows and tool listings on Leda."
          href="/marketplace/creators"
          cta="All creators"
        />
        {topCreators.length > 0 ? (
          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topCreators.map((creator) => (
              <StaggerItem key={creator.id}>
                <SpotlightCard className="h-full rounded-2xl">
                  <CreatorCard creator={creator} />
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            icon={Users}
            title="No creators yet"
            description="Be the first to share a workflow with the community."
          />
        )}
      </section>

      {/* Status legend */}
      <section>
        <SectionHead
          eyebrow="Reading the badges"
          title="Status & trust legend"
          description="Every card carries a status badge so you always know how much review a workflow or tool has had."
        />
        <Reveal>
        <Card className="p-0">
          <ul className="divide-y divide-white/[0.06]">
            {LEGEND.map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-4"
              >
                <span
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    item.box,
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", item.dot)}
                    aria-hidden
                  />
                  {item.label}
                </span>
                <span className="text-sm leading-relaxed text-ink-muted">
                  {item.description}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        </Reveal>
      </section>

      {/* Become a creator CTA */}
      <Reveal as="section">
        <div className="gradient-border rounded-3xl">
          <div className="grain relative overflow-hidden rounded-3xl bg-[#0A0D17]/80 p-8 sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  "radial-gradient(55% 80% at 0% 100%, rgba(45,212,191,0.18), transparent 60%), radial-gradient(55% 80% at 100% 0%, rgba(59,130,246,0.18), transparent 60%)",
              }}
            />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  Made something that works?{" "}
                  <span className="text-gradient">Share it.</span>
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                  Publish workflow templates and tool listings to the Leda
                  community. You keep ownership; every submission is reviewed
                  before it goes live.
                </p>
              </div>
              <Magnetic>
                <ButtonLink
                  href="/creator/dashboard"
                  variant="primary"
                  size="lg"
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Become a creator
                </ButtonLink>
              </Magnetic>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
