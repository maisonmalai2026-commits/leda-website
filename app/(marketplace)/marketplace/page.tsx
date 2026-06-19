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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-[1.7rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {href && cta ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-sky underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
        >
          {cta}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
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
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-12 sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent-teal" aria-hidden />
            Leda Marketplace
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Build once. Share what works.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
            Discover workflows and trusted tools made for Leda.
          </p>

          <div className="mt-7 max-w-xl">
            <HomeSearch />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ButtonLink href="/marketplace/workflows" variant="primary">
              <Workflow className="h-4 w-4" aria-hidden />
              Browse workflows
            </ButtonLink>
            <ButtonLink href="/marketplace/plugins" variant="secondary">
              <Puzzle className="h-4 w-4" aria-hidden />
              Browse tools
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Safety message */}
      <section>
        <Card className="flex flex-col gap-4 border-accent-teal/20 bg-accent-teal/[0.04] sm:flex-row sm:items-start sm:gap-5">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-teal/25 bg-accent-teal/10 text-accent-teal"
            aria-hidden
          >
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
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
      </section>

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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                flags={flags}
              />
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPlugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} flags={flags} />
            ))}
          </div>
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
          <div className="flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/marketplace/categories/${category.slug}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-ink-muted",
                  "transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                )}
              >
                <Tag className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                {category.name}
              </Link>
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
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
        <Card className="p-0">
          <ul className="divide-y divide-white/[0.06]">
            {LEGEND.map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
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
      </section>

      {/* Become a creator CTA */}
      <section>
        <Card className="relative overflow-hidden border-white/[0.10] bg-gradient-to-br from-accent-blue/[0.12] via-transparent to-accent-teal/[0.08]">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-accent-teal/10 blur-3xl"
          />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Made something that works? Share it.
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                Publish workflow templates and tool listings to the Leda
                community. You keep ownership; every submission is reviewed
                before it goes live.
              </p>
            </div>
            <ButtonLink
              href="/creator/dashboard"
              variant="primary"
              size="lg"
              className="shrink-0"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Become a creator
            </ButtonLink>
          </div>
        </Card>
      </section>
    </div>
  );
}
