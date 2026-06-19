import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  Heart,
  Puzzle,
  Workflow as WorkflowIcon,
} from "lucide-react";

import {
  getCreatorByHandle,
  listPluginsByOwner,
  listWorkflowsByOwner,
} from "@/lib/marketplace/data";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { WorkflowCard } from "@/components/marketplace/WorkflowCard";
import { PluginCard } from "@/components/marketplace/PluginCard";
import { FollowButton } from "@/components/marketplace/FollowButton";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { ProfileTabs } from "./ProfileTabs";
import type { Profile } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// /u/[handle] — public creator profile. Server component.
//
// Privacy: only public profiles are reachable. getCreatorByHandle already
// returns null for missing OR non-public profiles, and we defensively re-check
// profile_visibility before rendering. Email and any private fields are never
// surfaced — we render only display_name, handle, bio, website, joined date,
// and the read-only aggregate counts computed by the data layer.
// ---------------------------------------------------------------------------

function initials(name: string, handle: string): string {
  const source = (name || handle || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatCount(n: number | undefined): string {
  return Number.isFinite(n) ? (n as number).toLocaleString() : "0";
}

function formatJoined(iso: string): string | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

/** Strip a URL down to a tidy display label (host + path, no protocol). */
function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.host}${path}`;
  } catch {
    return url;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const profile = await getCreatorByHandle(params.handle);

  if (!profile || profile.profile_visibility !== "public") {
    return {
      title: "Creator not found — Leda Marketplace",
      robots: { index: false, follow: false },
    };
  }

  const title = `${profile.display_name} (@${profile.handle}) — Leda Marketplace`;
  const description =
    profile.bio?.trim() ||
    `Workflows and plugins shared by @${profile.handle} on the Leda Marketplace.`;
  const canonical = `/u/${profile.handle}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
    },
  };
}

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Heart;
  value: number | undefined;
  label: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 transition-colors hover:border-white/[0.16]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-lg font-semibold tabular-nums text-ink">
          {formatCount(value)}
        </span>
        <span className="text-[12px] text-ink-muted">{label}</span>
      </span>
    </div>
  );
}

export default async function CreatorProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const profile = await getCreatorByHandle(params.handle);

  // notFound() for missing OR non-public profiles (defensive double-check).
  if (!profile || profile.profile_visibility !== "public") {
    notFound();
  }

  const safeProfile = profile as Profile;
  const flags = getMarketplaceFlags();

  const [workflows, plugins] = await Promise.all([
    listWorkflowsByOwner(safeProfile.id),
    listPluginsByOwner(safeProfile.id),
  ]);

  const joined = formatJoined(safeProfile.created_at);
  const verified = safeProfile.is_verified_creator;

  const workflowsPanel =
    workflows.length === 0 ? (
      <EmptyState
        icon={WorkflowIcon}
        title="No public workflows yet"
        description={`@${safeProfile.handle} hasn't published any public workflows.`}
      />
    ) : (
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <StaggerItem key={workflow.id} className="flex">
            <SpotlightCard className="h-full w-full rounded-2xl">
              <WorkflowCard workflow={workflow} flags={flags} />
            </SpotlightCard>
          </StaggerItem>
        ))}
      </Stagger>
    );

  const pluginsPanel =
    plugins.length === 0 ? (
      <EmptyState
        icon={Puzzle}
        title="No public plugins yet"
        description={`@${safeProfile.handle} hasn't published any public plugins.`}
      />
    ) : (
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <StaggerItem key={plugin.id} className="flex">
            <SpotlightCard className="h-full w-full rounded-2xl">
              <PluginCard plugin={plugin} flags={flags} />
            </SpotlightCard>
          </StaggerItem>
        ))}
      </Stagger>
    );

  return (
    <div className="flex flex-col gap-8">
      {/* Profile header */}
      <Reveal>
        <div className="conic-border rounded-3xl">
          <div className="grain relative flex flex-col gap-7 overflow-hidden rounded-3xl bg-[#0B0E18]/80 p-6 backdrop-blur-[2px] sm:p-8">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(56,189,248,0.32), rgba(139,92,246,0.18) 55%, transparent 72%)",
              }}
            />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4 sm:gap-5">
                <span
                  className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-br from-accent-blue/30 to-accent-teal/25 font-display text-lg font-semibold text-ink shadow-glow-blue ring-1 ring-inset ring-white/10 sm:h-20 sm:w-20 sm:text-2xl"
                  aria-hidden
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-2xl bg-accent-cyan/20 blur-xl"
                  />
                  {initials(safeProfile.display_name, safeProfile.handle)}
                </span>

                <div className="min-w-0">
                  <h1 className="flex flex-wrap items-center gap-2.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {safeProfile.display_name}
                    {verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent-sky/30 bg-accent-sky/10 px-2.5 py-0.5 text-[12px] font-medium text-accent-sky shadow-[0_0_18px_-6px_rgba(56,189,248,0.7)]">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        Verified creator
                      </span>
                    ) : null}
                  </h1>
                  <p className="mt-1.5 font-mono text-[14px] text-accent-cyan/90">
                    @{safeProfile.handle}
                  </p>

                  {safeProfile.bio ? (
                    <p className="mt-3.5 max-w-prose text-[15px] leading-relaxed text-ink-muted">
                      {safeProfile.bio}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-faint">
                    {safeProfile.website_url ? (
                      <a
                        href={safeProfile.website_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 rounded-sm font-medium text-accent-sky underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        {prettyUrl(safeProfile.website_url)}
                      </a>
                    ) : null}
                    {joined ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        Joined {joined}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <FollowButton creatorId={safeProfile.id} />
              </div>
            </div>

            {/* Public aggregate counts (read-only, from the data layer) */}
            <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatChip
                icon={WorkflowIcon}
                value={safeProfile.public_workflow_count}
                label="public workflows"
              />
              <StatChip
                icon={Puzzle}
                value={safeProfile.public_plugin_count}
                label="public plugins"
              />
              <StatChip
                icon={Heart}
                value={safeProfile.total_likes}
                label="total likes"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Content tabs */}
      <ProfileTabs
        workflowCount={workflows.length}
        pluginCount={plugins.length}
        workflows={workflowsPanel}
        plugins={pluginsPanel}
      />
    </div>
  );
}
