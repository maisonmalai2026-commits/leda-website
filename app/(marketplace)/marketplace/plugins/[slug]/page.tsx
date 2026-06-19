import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ExternalLink,
  GitBranch,
  History,
  LifeBuoy,
  Lock,
  MonitorCog,
  Puzzle,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { getPluginBySlug, listReviews } from "@/lib/marketplace/data";
import type { PluginListing } from "@/lib/marketplace/types";

import { Card, SectionHeading } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";
import {
  DemoBadge,
  ListingOnlyBadge,
  ModerationBadge,
  PricingBadge,
  TrustBadge,
} from "@/components/marketplace/ui/TrustBadge";
import { StarRating } from "@/components/marketplace/ui/StarRating";
import { OpenInLedaButton } from "@/components/marketplace/OpenInLedaButton";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { BookmarkButton } from "@/components/marketplace/BookmarkButton";
import { ReportButton } from "@/components/marketplace/ReportButton";
import { ReviewList } from "@/components/marketplace/ReviewList";
import { ReviewForm } from "@/components/marketplace/ReviewForm";

// ---------------------------------------------------------------------------
// Plugin detail — server component. Fetches the listing through the data
// facade (which enforces public visibility), 404s when missing, and renders the
// full, transparent listing: description, permissions ("what it can / cannot
// access"), setup, links, trust + moderation badges, the correct "Install in
// Leda" desktop state, reviews, and like / bookmark / report controls.
//
// SAFETY: this page never offers a direct download or executable link. It only
// surfaces metadata and points at the desktop app via OpenInLedaButton.
// ---------------------------------------------------------------------------

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const plugin = await getPluginBySlug(params.slug);
  if (!plugin) {
    return {
      title: "Plugin not found",
      description: "This plugin listing could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const url = `/marketplace/plugins/${plugin.slug}`;
  return {
    title: plugin.name,
    description: plugin.short_description,
    alternates: { canonical: url },
    openGraph: {
      title: `${plugin.name} — Leda plugin`,
      description: plugin.short_description,
      url,
      type: "website",
    },
  };
}

const sectionTitle =
  "flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint";

function isReviewedTier(plugin: PluginListing): boolean {
  return plugin.trust_status === "official" || plugin.trust_status === "verified";
}

export default async function PluginDetailPage({ params }: PageProps) {
  const plugin = await getPluginBySlug(params.slug);
  if (!plugin) {
    notFound();
  }

  const flags = getMarketplaceFlags();
  const reviews = await listReviews("plugin", plugin.id);

  const handle = plugin.owner?.handle ?? null;
  const ownerName = plugin.owner?.display_name ?? "Unknown creator";
  const isListingOnly = plugin.installation_model === "listing_only";

  const permissions = plugin.declared_permissions ?? [];
  const cannotAccess = plugin.cannot_access ?? [];
  const requiredApps = plugin.required_apps ?? [];
  const compatibility = plugin.compatibility ?? [];

  const links = [
    plugin.documentation_url
      ? {
          href: plugin.documentation_url,
          label: "Documentation",
          Icon: BookOpen,
        }
      : null,
    // We label the source link plainly and never present it as a download.
    plugin.source_url
      ? { href: plugin.source_url, label: "Source", Icon: ExternalLink }
      : null,
    plugin.support_url
      ? { href: plugin.support_url, label: "Support", Icon: LifeBuoy }
      : null,
  ].filter(
    (l): l is { href: string; label: string; Icon: typeof BookOpen } =>
      l !== null,
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-faint">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/marketplace/plugins"
              className="rounded-sm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              Plugins
            </Link>
          </li>
          <li aria-hidden className="text-ink-faint">
            /
          </li>
          <li className="text-ink-muted" aria-current="page">
            {plugin.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <TrustBadge status={plugin.trust_status} />
              <ModerationBadge status={plugin.moderation_status} />
              <PricingBadge
                model={plugin.pricing_model}
                paymentsEnabled={flags.paymentsEnabled}
              />
              {plugin.is_demo ? <DemoBadge /> : null}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {plugin.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                {plugin.category?.name ? (
                  <span>{plugin.category.name}</span>
                ) : null}
                {plugin.category?.name ? (
                  <span aria-hidden className="text-ink-faint">
                    ·
                  </span>
                ) : null}
                <span>
                  by{" "}
                  {handle ? (
                    <Link
                      href={`/u/${handle}`}
                      className="font-medium text-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                    >
                      {ownerName}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink">{ownerName}</span>
                  )}
                  {handle ? (
                    <span className="ml-1.5 text-ink-faint">@{handle}</span>
                  ) : null}
                </span>
              </p>
            </div>

            <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted">
              {plugin.short_description}
            </p>

            {plugin.rating_count > 0 ? (
              <StarRating
                value={plugin.rating_avg}
                count={plugin.rating_count}
              />
            ) : (
              <p className="text-[13px] text-ink-faint">No ratings yet</p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <LikeButton
                targetType="plugin"
                targetId={plugin.id}
                initialCount={plugin.like_count}
              />
              <BookmarkButton targetType="plugin" targetId={plugin.id} />
              <ReportButton targetType="plugin" targetId={plugin.id} />
            </div>
          </header>

          {/* About */}
          <section aria-labelledby="about-heading" className="flex flex-col gap-3">
            <h2 id="about-heading" className={sectionTitle}>
              <Puzzle className="h-4 w-4" aria-hidden />
              About this plugin
            </h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">
              {plugin.long_description}
            </p>
            {plugin.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {plugin.tags.map((t) => (
                  <Pill key={t}>#{t}</Pill>
                ))}
              </div>
            ) : null}
          </section>

          {/* Permissions: what it can / cannot access */}
          <section
            aria-labelledby="permissions-heading"
            className="flex flex-col gap-4"
          >
            <h2 id="permissions-heading" className={sectionTitle}>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Permissions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="flex flex-col gap-3 p-5">
                <h3 className="text-sm font-semibold text-ink">
                  What it can access
                </h3>
                {permissions.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {permissions.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal"
                          aria-hidden
                        />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-ink-faint">
                    No special permissions declared.
                  </p>
                )}
              </Card>

              <Card className="flex flex-col gap-3 p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Lock className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                  What it cannot access
                </h3>
                {cannotAccess.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {cannotAccess.map((c) => (
                      <li
                        key={c}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted"
                      >
                        <X
                          className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/80"
                          aria-hidden
                        />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-ink-faint">
                    No explicit restrictions listed.
                  </p>
                )}
              </Card>
            </div>
          </section>

          {/* Compatibility + required apps */}
          <section
            aria-labelledby="compat-heading"
            className="flex flex-col gap-4"
          >
            <h2 id="compat-heading" className={sectionTitle}>
              <MonitorCog className="h-4 w-4" aria-hidden />
              Compatibility
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-[13px] font-medium text-ink-muted">
                  Runs on
                </h3>
                {compatibility.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {compatibility.map((c) => (
                      <Pill key={c} className="capitalize">
                        {c}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-faint">Not specified.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[13px] font-medium text-ink-muted">
                  Required apps
                </h3>
                {requiredApps.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {requiredApps.map((app) => (
                      <Pill key={app}>{app}</Pill>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-faint">
                    No external apps required.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Setup / installation instructions */}
          {plugin.installation_instructions ? (
            <section
              aria-labelledby="setup-heading"
              className="flex flex-col gap-3"
            >
              <h2 id="setup-heading" className={sectionTitle}>
                <Wrench className="h-4 w-4" aria-hidden />
                Setup
              </h2>
              <Card className="p-5">
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-muted">
                  {plugin.installation_instructions}
                </p>
              </Card>
            </section>
          ) : null}

          {/* Version history + changelog */}
          <section
            aria-labelledby="version-heading"
            className="flex flex-col gap-3"
          >
            <h2 id="version-heading" className={sectionTitle}>
              <History className="h-4 w-4" aria-hidden />
              Version history
            </h2>
            <Card className="flex flex-col gap-2 p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <GitBranch className="h-4 w-4 text-ink-faint" aria-hidden />
                Version {plugin.version}
              </p>
              {plugin.changelog ? (
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">
                  {plugin.changelog}
                </p>
              ) : (
                <p className="text-[13px] text-ink-faint">
                  No changelog provided for this version.
                </p>
              )}
              <p className="text-[12px] text-ink-faint">
                Full version history will appear here as the creator publishes
                updates.
              </p>
            </Card>
          </section>

          {/* Links */}
          {links.length > 0 ? (
            <section aria-labelledby="links-heading" className="flex flex-col gap-3">
              <h2 id="links-heading" className={sectionTitle}>
                <BookOpen className="h-4 w-4" aria-hidden />
                Documentation &amp; links
              </h2>
              <ul className="flex flex-wrap gap-2.5">
                {links.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-white/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                      <ExternalLink
                        className="h-3.5 w-3.5 text-ink-faint"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Reviews */}
          <section aria-labelledby="reviews-heading" className="flex flex-col gap-5">
            <SectionHeading title="Reviews" eyebrow="Community" />
            <ReviewList reviews={reviews} />
            <ReviewForm targetType="plugin" targetId={plugin.id} />
          </section>
        </div>

        {/* Sidebar: install state + at-a-glance */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-semibold text-ink">Install in Leda</h2>
            <OpenInLedaButton
              kind="plugin"
              slug={plugin.slug}
              trustStatus={plugin.trust_status}
            />
            {isListingOnly ? <ListingOnlyBadge /> : null}
            <p className="text-[12px] leading-relaxed text-ink-faint">
              {isReviewedTier(plugin)
                ? "This listing has been reviewed. Desktop installation support is on the way — nothing is installed from this page."
                : "Listing only. Community code is not automatically installed by Leda. Review the source before using it."}
            </p>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-ink">At a glance</h2>
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-faint">Trust tier</dt>
                <dd>
                  <TrustBadge status={plugin.trust_status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-faint">Version</dt>
                <dd className="font-medium tabular-nums text-ink">
                  v{plugin.version}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-faint">Pricing</dt>
                <dd>
                  <PricingBadge
                    model={plugin.pricing_model}
                    paymentsEnabled={flags.paymentsEnabled}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-faint">Install model</dt>
                <dd className="font-medium text-ink">
                  {isListingOnly ? "Listing only" : "Built in"}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
