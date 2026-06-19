import type { Metadata } from "next";
import { cloneElement } from "react";
import Link from "next/link";
import {
  Boxes,
  Heart,
  Bookmark,
  Copy,
  Star,
  Workflow as WorkflowIcon,
  Plug,
  Plus,
  ShieldCheck,
  Lock,
  Sparkles,
  MessageSquareWarning,
  UserPlus,
} from "lucide-react";

import { requireRole } from "@/lib/marketplace/auth";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import {
  listWorkflowsByOwner,
  listPluginsByOwner,
} from "@/lib/marketplace/data";
import { MODERATION_STATUS } from "@/lib/marketplace/types";
import type {
  ModerationStatus,
  PluginListing,
  WorkflowTemplate,
} from "@/lib/marketplace/types";

import { Card, SectionHeading } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import {
  ModerationBadge,
  DemoBadge,
} from "@/components/marketplace/ui/TrustBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";

// ---------------------------------------------------------------------------
// /creator/dashboard — gated to the "creator" role (or above).
//
// SERVER component. When the viewer is not a signed-in creator we render an
// accessible "Become a creator" gate (no crash, no redirect). When allowed we
// show a profile summary, honest stat tiles derived from the creator's own
// content, their workflow + plugin submissions grouped by moderation status,
// moderation feedback notes, submission entry points, and clearly-labeled
// "coming soon" placeholders for verification + future earnings.
//
// NOTE: in demo mode listWorkflowsByOwner/listPluginsByOwner only return
// publicly-visible (approved) content for the synthetic "demo-user" id, which
// owns none of the seed content — so the dashboard renders honest empty states
// rather than fabricating submissions. That is intentional and correct.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Creator dashboard — Leda Marketplace",
  description:
    "Manage your workflow templates and plugin listings, track review status, and submit new automations to the Leda Marketplace.",
  alternates: { canonical: "/creator/dashboard" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Creator dashboard — Leda Marketplace",
    description:
      "Manage your workflow templates and plugin listings on the Leda Marketplace.",
    url: "/creator/dashboard",
    type: "website",
  },
};

// Order moderation buckets from "in flight" to "retired" for display.
const STATUS_ORDER: ModerationStatus[] = [
  "changes_requested",
  "pending",
  "draft",
  "approved",
  "rejected",
  "deprecated",
  "removed",
];

function statusLabel(status: ModerationStatus): string {
  switch (status) {
    case "draft":
      return "Drafts";
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes requested";
    case "rejected":
      return "Rejected";
    case "deprecated":
      return "Deprecated";
    case "removed":
      return "Removed";
    default:
      return status;
  }
}

function groupByStatus<T extends { moderation_status: ModerationStatus }>(
  items: T[],
): Map<ModerationStatus, T[]> {
  const map = new Map<ModerationStatus, T[]>();
  for (const status of MODERATION_STATUS) {
    const matches = items.filter((i) => i.moderation_status === status);
    if (matches.length > 0) map.set(status, matches);
  }
  return map;
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
}) {
  return (
    <SpotlightCard className="h-full rounded-2xl">
      <div className="group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E18]/70 p-4 shadow-card backdrop-blur-[2px] transition-colors duration-300 hover:border-white/20">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-cyan/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        />
        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="relative min-w-0">
          <span className="block text-xl font-semibold tabular-nums text-ink">
            {value.toLocaleString()}
          </span>
          <span className="block text-[12px] text-ink-muted">{label}</span>
        </span>
      </div>
    </SpotlightCard>
  );
}

function WorkflowSubmissionRow({ item }: { item: WorkflowTemplate }) {
  return (
    <li className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.035]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <WorkflowIcon
              className="h-4 w-4 shrink-0 text-ink-faint"
              aria-hidden
            />
            <Link
              href={`/marketplace/workflows/${item.slug}`}
              className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              {item.title}
            </Link>
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] text-ink-muted">
            {item.short_description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item.is_demo ? <DemoBadge /> : null}
          <ModerationBadge status={item.moderation_status} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-faint">
        <span className="inline-flex items-center gap-1" title="Copies">
          <Copy className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {item.copied_count.toLocaleString()}
          </span>
          <span className="sr-only">copies</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Likes">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {item.like_count.toLocaleString()}
          </span>
          <span className="sr-only">likes</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Reviews">
          <Star className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {item.rating_count.toLocaleString()}
          </span>
          <span className="sr-only">reviews</span>
        </span>
        <span className="tabular-nums">v{item.version}</span>
      </div>

      {item.moderation_status === "changes_requested" ? (
        <p className="mt-3 inline-flex items-start gap-2 rounded-lg border border-sky-400/20 bg-sky-400/[0.06] px-3 py-2 text-[12px] leading-relaxed text-sky-200/90">
          <MessageSquareWarning
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden
          />
          <span>
            A reviewer asked for changes. Open the workflow to see their notes,
            then resubmit.
          </span>
        </p>
      ) : null}
    </li>
  );
}

function PluginSubmissionRow({ item }: { item: PluginListing }) {
  return (
    <li className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.035]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Plug className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
            <Link
              href={`/marketplace/plugins/${item.slug}`}
              className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              {item.name}
            </Link>
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] text-ink-muted">
            {item.short_description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item.is_demo ? <DemoBadge /> : null}
          <ModerationBadge status={item.moderation_status} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-faint">
        <span className="inline-flex items-center gap-1" title="Likes">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {item.like_count.toLocaleString()}
          </span>
          <span className="sr-only">likes</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Bookmarks">
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {item.bookmark_count.toLocaleString()}
          </span>
          <span className="sr-only">bookmarks</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Reviews">
          <Star className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {item.rating_count.toLocaleString()}
          </span>
          <span className="sr-only">reviews</span>
        </span>
        <span className="tabular-nums">v{item.version}</span>
      </div>

      {item.moderation_status === "changes_requested" ? (
        <p className="mt-3 inline-flex items-start gap-2 rounded-lg border border-sky-400/20 bg-sky-400/[0.06] px-3 py-2 text-[12px] leading-relaxed text-sky-200/90">
          <MessageSquareWarning
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden
          />
          <span>
            A reviewer asked for changes. Open the listing to see their notes,
            then resubmit.
          </span>
        </p>
      ) : null}
    </li>
  );
}

function SubmissionSection<
  T extends { id: string; moderation_status: ModerationStatus },
>({
  title,
  icon: Icon,
  items,
  createHref,
  createLabel,
  emptyTitle,
  emptyDescription,
  renderRow,
}: {
  title: string;
  icon: typeof WorkflowIcon;
  items: T[];
  createHref: string;
  createLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  renderRow: (item: T) => React.ReactElement;
}) {
  const grouped = groupByStatus(items);
  const orderedStatuses = STATUS_ORDER.filter((s) => grouped.has(s));

  return (
    <Reveal>
      <section
        aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}
            className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-teal">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            {title}
            <span className="text-sm font-normal text-ink-faint">
              ({items.length})
            </span>
          </h2>
          <ButtonLink href={createHref} variant="secondary" size="md">
            <Plus className="h-4 w-4" aria-hidden />
            {createLabel}
          </ButtonLink>
        </div>

        {items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <ButtonLink href={createHref} variant="primary">
              <Plus className="h-4 w-4" aria-hidden />
              {createLabel}
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {orderedStatuses.map((status) => {
            const bucket = grouped.get(status)!;
            return (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ModerationBadge status={status} />
                  <h3 className="text-sm font-medium text-ink-muted">
                    {statusLabel(status)}
                    <span className="ml-1 text-ink-faint">
                      ({bucket.length})
                    </span>
                  </h3>
                </div>
                <ul role="list" className="flex flex-col gap-2.5">
                  {bucket.map((item) =>
                    cloneElement(renderRow(item), { key: item.id }),
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      </section>
    </Reveal>
  );
}

export default async function CreatorDashboardPage() {
  const user = await requireRole("creator");
  const flags = getMarketplaceFlags();

  // -------------------------------------------------------------------------
  // GATE: not signed in as a creator → accessible "Become a creator" state.
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="flex flex-col gap-8">
        <Reveal>
          <SectionHeading
            eyebrow="For creators"
            title="Creator dashboard"
            description="Publish and manage your workflow templates and plugin listings on the Leda Marketplace."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grain relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.015]">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle,rgba(139,92,246,0.4),transparent 70%)",
              }}
            />
            <EmptyState
              className="border-transparent bg-transparent"
              icon={ShieldCheck}
              title="Become a creator to publish"
              description={
                flags.demoMode
                  ? "This area is for creators. In demo mode, open the account menu in the top bar and switch your demo identity to “Creator” to explore the dashboard and submission flows."
                  : "You need a creator account to publish workflows and plugins. Sign in as a creator to access your dashboard."
              }
              action={
                <ButtonLink href="/marketplace" variant="secondary">
                  Browse the marketplace
                </ButtonLink>
              }
            />
          </div>
        </Reveal>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ALLOWED: load the creator's own submissions + compute honest stats.
  // -------------------------------------------------------------------------
  const [workflows, plugins] = await Promise.all([
    listWorkflowsByOwner(user.id),
    listPluginsByOwner(user.id),
  ]);

  const totalLikes =
    workflows.reduce((sum, w) => sum + w.like_count, 0) +
    plugins.reduce((sum, p) => sum + p.like_count, 0);
  const totalBookmarks =
    workflows.reduce((sum, w) => sum + w.bookmark_count, 0) +
    plugins.reduce((sum, p) => sum + p.bookmark_count, 0);
  const totalCopies = workflows.reduce((sum, w) => sum + w.copied_count, 0);
  const totalReviews =
    workflows.reduce((sum, w) => sum + w.rating_count, 0) +
    plugins.reduce((sum, p) => sum + p.rating_count, 0);

  const profile = user.profile;
  const initials =
    profile.display_name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-10">
      {/* Profile summary */}
      <Reveal as="header" className="flex flex-col gap-6">
        <div className="gradient-border rounded-3xl">
          <Card className="grain relative flex flex-col gap-5 overflow-hidden rounded-3xl border-transparent bg-gradient-to-br from-accent-blue/[0.06] via-transparent to-accent-violet/[0.05] sm:flex-row sm:items-center sm:justify-between">
            <div
              aria-hidden
              className="absolute -left-16 -top-20 h-56 w-56 rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle,rgba(56,189,248,0.28),transparent 70%)",
              }}
            />
            <div className="relative flex items-center gap-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 font-display text-lg font-semibold text-ink shadow-glow-blue">
                {initials}
              </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-semibold text-ink">
                  {profile.display_name}
                </h1>
                {profile.is_verified_creator ? (
                  <Pill className="border-accent-sky/30 bg-accent-sky/10 text-accent-sky">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Verified creator
                  </Pill>
                ) : null}
                {user.is_demo ? <DemoBadge /> : null}
              </div>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                <Link
                  href={`/u/${profile.handle}`}
                  className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                >
                  @{profile.handle}
                </Link>
                <span className="mx-1.5 text-ink-faint" aria-hidden>
                  ·
                </span>
                <span className="capitalize">{user.role}</span>
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-2.5">
            <ButtonLink href="/creator/submit/workflow" variant="primary">
              <WorkflowIcon className="h-4 w-4" aria-hidden />
              Create workflow template
            </ButtonLink>
            <ButtonLink href="/creator/submit/plugin" variant="secondary">
              <Plug className="h-4 w-4" aria-hidden />
              Submit plugin listing
            </ButtonLink>
          </div>
          </Card>
        </div>

        {/* Stat tiles — honest, derived from the creator's own content. */}
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StaggerItem className="h-full">
            <StatTile icon={Heart} label="Likes" value={totalLikes} />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatTile icon={Bookmark} label="Bookmarks" value={totalBookmarks} />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatTile icon={Copy} label="Copies" value={totalCopies} />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatTile icon={Star} label="Reviews" value={totalReviews} />
          </StaggerItem>
        </Stagger>
      </Reveal>

      {/* Workflow submissions */}
      <SubmissionSection
        title="Workflow templates"
        icon={WorkflowIcon}
        items={workflows}
        createHref="/creator/submit/workflow"
        createLabel="Create workflow template"
        emptyTitle="No workflow templates yet"
        emptyDescription="Build a declarative workflow template and submit it for human review. Approved templates appear publicly in the marketplace."
        renderRow={(item) => <WorkflowSubmissionRow item={item} />}
      />

      {/* Plugin submissions */}
      <SubmissionSection
        title="Plugin listings"
        icon={Boxes}
        items={plugins}
        createHref="/creator/submit/plugin"
        createLabel="Submit plugin listing"
        emptyTitle="No plugin listings yet"
        emptyDescription="List a plugin so people can discover it. Listings are metadata-only — no code or executables are uploaded through the marketplace."
        renderRow={(item) => <PluginSubmissionRow item={item} />}
      />

      {/* Placeholder cards: verification + earnings */}
      <Reveal>
        <section
          aria-labelledby="creator-extras-heading"
          className="flex flex-col gap-4"
        >
        <h2
          id="creator-extras-heading"
          className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
            <UserPlus className="h-4 w-4" aria-hidden />
          </span>
          Account
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Verification placeholder */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-accent-sky/25 bg-accent-sky/10 text-accent-sky">
                <UserPlus className="h-4.5 w-4.5" aria-hidden />
              </span>
              <h3 className="text-base font-semibold text-ink">
                Creator verification
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">
              Verification adds a trust badge to your profile and listings after
              a manual review. This program isn&apos;t open yet.
            </p>
            <div>
              <Button variant="secondary" disabled aria-disabled="true">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Request verification
              </Button>
              <p className="mt-2 text-[12px] text-ink-faint">
                Coming soon — we&apos;ll announce when applications open.
              </p>
            </div>
          </Card>

          {/* Future earnings placeholder — gated by paymentsEnabled() */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-ink-muted">
                {flags.paymentsEnabled ? (
                  <Sparkles className="h-4.5 w-4.5" aria-hidden />
                ) : (
                  <Lock className="h-4.5 w-4.5" aria-hidden />
                )}
              </span>
              <h3 className="text-base font-semibold text-ink">
                Future earnings
              </h3>
            </div>
            {flags.paymentsEnabled ? (
              <p className="text-sm leading-relaxed text-ink-muted">
                Paid listings and payouts are enabled for this environment. Your
                earnings and payout setup will appear here.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Everything on the marketplace is free right now. Paid listings,
                  revenue, and creator payouts are not available yet.
                </p>
                <Pill className="self-start border-white/12 bg-white/[0.04] text-ink-muted">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Premium marketplace coming later
                </Pill>
              </>
            )}
          </Card>
        </div>
        </section>
      </Reveal>
    </div>
  );
}
