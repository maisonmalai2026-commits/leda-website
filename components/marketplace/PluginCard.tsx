import Link from "next/link";
import { ArrowUpRight, Heart, GitBranch, ShieldQuestion } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  DemoBadge,
  ListingOnlyBadge,
  PricingBadge,
  TrustBadge,
} from "@/components/marketplace/ui/TrustBadge";
import type { MarketplaceFlags } from "@/lib/marketplace/config";
import type { PluginListing } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// PluginCard — server component. Presentational only. Shows name, category,
// short description, TrustBadge, required app(s), permission summary, version,
// PricingBadge, ListingOnlyBadge (when installation_model === "listing_only"),
// DemoBadge, and a "View details" link to the plugin detail route.
// ---------------------------------------------------------------------------

const chip =
  "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-ink-muted";

function formatCount(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

function permissionSummary(permissions: string[]): string {
  if (!permissions || permissions.length === 0) {
    return "No special permissions declared";
  }
  if (permissions.length === 1) {
    return `1 permission: ${permissions[0]}`;
  }
  const head = permissions.slice(0, 2).join(", ");
  const rest = permissions.length - 2;
  return rest > 0
    ? `${permissions.length} permissions: ${head} +${rest} more`
    : `${permissions.length} permissions: ${head}`;
}

export function PluginCard({
  plugin,
  flags,
}: {
  plugin: PluginListing;
  flags?: MarketplaceFlags;
}) {
  const href = `/marketplace/plugins/${plugin.slug}`;
  const paymentsEnabled = flags?.paymentsEnabled ?? false;
  const handle = plugin.owner?.handle ?? null;
  const isListingOnly = plugin.installation_model === "listing_only";
  const requiredApps = (plugin.required_apps ?? []).slice(0, 3);
  const extraApps = (plugin.required_apps?.length ?? 0) - requiredApps.length;

  return (
    <Card
      interactive
      className="group relative flex h-full flex-col gap-4 p-5"
    >
      {/* Header: badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <TrustBadge status={plugin.trust_status} />
        <PricingBadge
          model={plugin.pricing_model}
          paymentsEnabled={paymentsEnabled}
        />
        {plugin.is_demo ? <DemoBadge /> : null}
      </div>

      {/* Title + category + owner */}
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-snug text-ink">
          <Link
            href={href}
            className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-accent-sky/70"
          >
            {plugin.name}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-muted">
          {plugin.category?.name ? (
            <span className="text-ink-muted">{plugin.category.name}</span>
          ) : null}
          {handle ? (
            <>
              {plugin.category?.name ? (
                <span className="text-ink-faint" aria-hidden>
                  ·
                </span>
              ) : null}
              <Link
                href={`/u/${handle}`}
                className="relative z-10 font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
              >
                @{handle}
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
        {plugin.short_description}
      </p>

      {/* Required apps */}
      {requiredApps.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Requires
          </span>
          {requiredApps.map((app) => (
            <span key={app} className={chip}>
              {app}
            </span>
          ))}
          {extraApps > 0 ? <span className={chip}>+{extraApps} more</span> : null}
        </div>
      ) : null}

      {/* Permission summary */}
      <p className="inline-flex items-start gap-1.5 text-[12px] text-ink-faint">
        <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{permissionSummary(plugin.declared_permissions)}</span>
      </p>

      {isListingOnly ? <ListingOnlyBadge /> : null}

      {/* Footer: metrics + link */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-3 text-[12px] text-ink-faint">
          <span className="inline-flex items-center gap-1" title="Likes">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(plugin.like_count)}</span>
            <span className="sr-only">likes</span>
          </span>
          <span
            className="inline-flex items-center gap-1"
            title={`Version ${plugin.version}`}
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">v{plugin.version}</span>
          </span>
        </div>
        <span
          className={cn(
            "relative z-10 inline-flex items-center gap-1 text-[13px] font-medium text-accent-sky",
            "transition-transform group-hover:translate-x-0.5",
          )}
          aria-hidden
        >
          View details
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
