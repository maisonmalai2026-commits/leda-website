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
    <div className="mb-5 flex items-center gap-2">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums">
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
    <div className="space-y-10">
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Marketplace
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            {category.description}
          </p>
        ) : null}
      </div>

      {isEmpty ? (
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
      ) : (
        <>
          {workflows.length > 0 ? (
            <section>
              <SectionHead title="Workflows" count={workflows.length} />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    flags={flags}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {plugins.length > 0 ? (
            <section>
              <SectionHead title="Tools" count={plugins.length} />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {plugins.map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} flags={flags} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Honest note when one side is empty */}
          {workflows.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-ink-faint">
              <Workflow className="h-4 w-4" aria-hidden />
              No workflows in this category yet.
            </p>
          ) : null}
          {plugins.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-ink-faint">
              <Puzzle className="h-4 w-4" aria-hidden />
              No tools in this category yet.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
