import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Puzzle, Workflow } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import {
  getCategoryBySlug,
  listWorkflows,
  listPlugins,
} from "@/lib/marketplace/data";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { WorkflowCard } from "@/components/marketplace/WorkflowCard";
import { PluginCard } from "@/components/marketplace/PluginCard";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    return {
      title: "Category not found — Leda Marketplace",
      robots: { index: false, follow: false },
    };
  }
  const title = `${category.name} — Leda Marketplace`;
  const description =
    category.description ??
    `Workflows and tools in the ${category.name} category on the Leda Marketplace.`;
  return {
    title,
    description,
    alternates: { canonical: `/marketplace/categories/${category.slug}` },
    openGraph: {
      title,
      description,
      url: `/marketplace/categories/${category.slug}`,
      type: "website",
    },
  };
}

function SectionHead({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span
        aria-hidden
        className="h-1 w-6 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet"
      />
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-xs font-medium text-ink-muted tabular-nums">
        {count}
      </span>
    </div>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }

  const flags = getMarketplaceFlags();
  const [workflows, plugins] = await Promise.all([
    listWorkflows({ category: category.slug }),
    listPlugins({ category: category.slug }),
  ]);

  const isEmpty = workflows.length === 0 && plugins.length === 0;

  return (
    <div className="space-y-12">
      <Reveal>
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -left-16 -top-20 h-56 w-[34rem] rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(56,189,248,0.28), rgba(139,92,246,0.16) 55%, transparent 72%)",
            }}
          />
          <div className="relative">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Marketplace
            </Link>
            <h1 className="mt-5 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              <span className="text-gradient">{category.name}</span>
            </h1>
            {category.description ? (
              <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-base">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
      </Reveal>

      {isEmpty ? (
        <Reveal delay={0.1}>
          <EmptyState
            icon={Workflow}
            title={`Nothing in ${category.name} yet`}
            description="No workflows or tools have been published in this category. Explore the full marketplace instead."
            action={
              <ButtonLink href="/marketplace" variant="secondary">
                Back to marketplace
              </ButtonLink>
            }
          />
        </Reveal>
      ) : (
        <>
          {workflows.length > 0 ? (
            <section>
              <Reveal>
                <SectionHead title="Workflows" count={workflows.length} />
              </Reveal>
              <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <StaggerItem key={workflow.id} className="flex">
                    <SpotlightCard className="h-full w-full rounded-2xl">
                      <WorkflowCard workflow={workflow} flags={flags} />
                    </SpotlightCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          ) : null}

          {plugins.length > 0 ? (
            <section>
              <Reveal>
                <SectionHead title="Tools" count={plugins.length} />
              </Reveal>
              <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {plugins.map((plugin) => (
                  <StaggerItem key={plugin.id} className="flex">
                    <SpotlightCard className="h-full w-full rounded-2xl">
                      <PluginCard plugin={plugin} flags={flags} />
                    </SpotlightCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          ) : null}

          {/* Honest note when one side is empty */}
          {workflows.length === 0 ? (
            <p className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-sm text-ink-faint">
              <Workflow className="h-4 w-4 shrink-0" aria-hidden />
              No workflows in this category yet.
            </p>
          ) : null}
          {plugins.length === 0 ? (
            <p className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-sm text-ink-faint">
              <Puzzle className="h-4 w-4 shrink-0" aria-hidden />
              No tools in this category yet.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
