import Link from "next/link";
import { ArrowUpRight, Copy, Heart, GitBranch } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import {
  DemoBadge,
  ModerationBadge,
  PricingBadge,
} from "@/components/marketplace/ui/TrustBadge";
import type { MarketplaceFlags } from "@/lib/marketplace/config";
import type { WorkflowTemplate } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// WorkflowCard — server component. Presentational only (no client state). Shows
// title, creator handle, short description, required tools, RiskBadge,
// moderation status, copied/likes counters, version, PricingBadge, DemoBadge,
// and a "View workflow" link to the detail route.
// ---------------------------------------------------------------------------

const chip =
  "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-ink-muted";

function formatCount(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

export function WorkflowCard({
  workflow,
  flags,
}: {
  workflow: WorkflowTemplate;
  flags?: MarketplaceFlags;
}) {
  const href = `/marketplace/workflows/${workflow.slug}`;
  const paymentsEnabled = flags?.paymentsEnabled ?? false;
  const handle = workflow.owner?.handle ?? null;
  const requiredTools = (workflow.required_plugins ?? []).filter(
    (p) => !p.optional,
  );
  const shownTools = requiredTools.slice(0, 3);
  const extraTools = requiredTools.length - shownTools.length;

  return (
    <Card
      interactive
      className="group relative flex h-full flex-col gap-4 p-5"
    >
      {/* Header: badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge risk={workflow.risk_level} />
        <PricingBadge
          model={workflow.pricing_model}
          paymentsEnabled={paymentsEnabled}
        />
        <ModerationBadge status={workflow.moderation_status} />
        {workflow.is_demo ? <DemoBadge /> : null}
      </div>

      {/* Title + creator */}
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-snug text-ink">
          <Link
            href={href}
            className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-accent-sky/70"
          >
            {workflow.title}
          </Link>
        </h3>
        {handle ? (
          <p className="mt-1 text-[13px] text-ink-muted">
            by{" "}
            <Link
              href={`/u/${handle}`}
              className="relative z-10 font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              @{handle}
            </Link>
          </p>
        ) : null}
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
        {workflow.short_description}
      </p>

      {/* Required tools */}
      {requiredTools.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Tools
          </span>
          {shownTools.map((tool) => (
            <span key={tool.slug || tool.name} className={chip}>
              {tool.name}
            </span>
          ))}
          {extraTools > 0 ? (
            <span className={chip}>+{extraTools} more</span>
          ) : null}
        </div>
      ) : null}

      {/* Footer: metrics + link */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-3 text-[12px] text-ink-faint">
          <span className="inline-flex items-center gap-1" title="Copies">
            <Copy className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(workflow.copied_count)}</span>
            <span className="sr-only">copies</span>
          </span>
          <span className="inline-flex items-center gap-1" title="Likes">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(workflow.like_count)}</span>
            <span className="sr-only">likes</span>
          </span>
          <span
            className="inline-flex items-center gap-1"
            title={`Version ${workflow.version}`}
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">v{workflow.version}</span>
          </span>
        </div>
        <span
          className={cn(
            "relative z-10 inline-flex items-center gap-1 text-[13px] font-medium text-accent-sky",
            "transition-transform group-hover:translate-x-0.5",
          )}
          aria-hidden
        >
          View workflow
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
