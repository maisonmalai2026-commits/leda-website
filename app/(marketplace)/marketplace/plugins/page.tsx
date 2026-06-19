import type { Metadata } from "next";
import { Puzzle, ShieldCheck } from "lucide-react";

import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { listPlugins } from "@/lib/marketplace/data";
import {
  PRICING_MODEL,
  TRUST_STATUS,
  type PluginFilter,
  type PluginSort,
  type PricingModel,
  type TrustStatus,
} from "@/lib/marketplace/types";
import { PluginCard } from "@/components/marketplace/PluginCard";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { SectionHeading } from "@/components/ui/Card";

import { PluginFilters } from "./PluginFilters";

// ---------------------------------------------------------------------------
// Plugin gallery — server component. Reads filter state from searchParams,
// fetches the publicly-visible plugins through the data facade, and renders a
// responsive grid of PluginCard with a co-located client filter bar.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Plugin marketplace",
  description:
    "Browse Leda plugins — official, verified, and community listings. Every listing is transparent about what it can and cannot access. Demo content is clearly labeled.",
  alternates: { canonical: "/marketplace/plugins" },
  openGraph: {
    title: "Plugin marketplace — Leda",
    description:
      "Browse Leda plugins by category and trust tier. Transparent permissions, honest labels, no auto-install.",
    url: "/marketplace/plugins",
    type: "website",
  },
};

const SORT_VALUES: PluginSort[] = [
  "trending",
  "newest",
  "highest_rated",
  "editors_picks",
];

/** Narrow a raw searchParam to a known PluginSort, defaulting to trending. */
function parseSort(value?: string): PluginSort | undefined {
  return value && (SORT_VALUES as string[]).includes(value)
    ? (value as PluginSort)
    : undefined;
}

/** Narrow a raw searchParam to a known TrustStatus, else undefined. */
function parseTrust(value?: string): TrustStatus | undefined {
  return value && (TRUST_STATUS as readonly string[]).includes(value)
    ? (value as TrustStatus)
    : undefined;
}

/** Narrow a raw searchParam to a known PricingModel, else undefined. */
function parsePricing(value?: string): PricingModel | undefined {
  return value && (PRICING_MODEL as readonly string[]).includes(value)
    ? (value as PricingModel)
    : undefined;
}

/** First value when a searchParam arrives as an array, else the string. */
function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PluginsGalleryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const flags = getMarketplaceFlags();

  const q = first(searchParams.q)?.trim() || undefined;
  const category = first(searchParams.category) || undefined;
  const trustStatus = parseTrust(first(searchParams.trust_status));
  const requiredApp = first(searchParams.required_app)?.trim() || undefined;
  const pricing = parsePricing(first(searchParams.pricing));
  const sort = parseSort(first(searchParams.sort));

  const filter: PluginFilter = {
    query: q,
    category,
    trust_status: trustStatus,
    required_app: requiredApp,
    pricing,
    sort,
  };

  const plugins = await listPlugins(filter);
  const hasActiveFilters = Boolean(
    q || category || trustStatus || requiredApp || pricing,
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <SectionHeading
          eyebrow="Marketplace"
          title="Plugins"
          description="Connectors and tools your workflows can call. Each listing shows its trust tier and is transparent about what it can and cannot access. Community code is never installed automatically."
        />
        <p className="inline-flex items-start gap-2 text-[13px] leading-relaxed text-ink-faint">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal"
            aria-hidden
          />
          <span>
            Listings are metadata only. Official and verified plugins have been
            reviewed; community and experimental listings are not installed by
            Leda automatically.
          </span>
        </p>
      </header>

      <PluginFilters
        q={q}
        category={category}
        trustStatus={trustStatus}
        sort={sort ?? "trending"}
      />

      <section aria-label="Plugin results">
        <p className="mb-4 text-[13px] text-ink-faint" role="status">
          {plugins.length}{" "}
          {plugins.length === 1 ? "plugin" : "plugins"}
          {hasActiveFilters ? " match your filters" : " available"}
        </p>

        {plugins.length === 0 ? (
          <EmptyState
            icon={Puzzle}
            title="No plugins match your filters"
            description={
              hasActiveFilters
                ? "Try clearing the search or choosing a different category or trust tier."
                : "There are no plugin listings to show yet. Check back soon."
            }
          />
        ) : (
          <ul
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Plugins"
          >
            {plugins.map((plugin) => (
              <li key={plugin.id} className="flex">
                <PluginCard plugin={plugin} flags={flags} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
