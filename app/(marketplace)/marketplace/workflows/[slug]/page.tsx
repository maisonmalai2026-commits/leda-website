import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  GitBranch,
  History,
  ListChecks,
  Lock,
  Plug,
  ShieldCheck,
  Tag,
  XCircle,
  Zap,
} from "lucide-react";

import { getMarketplaceFlags } from "@/lib/marketplace/config";
import {
  getWorkflowBySlug,
  listReviews,
} from "@/lib/marketplace/data";
import {
  TRIGGER_NODE_TYPES,
  type WorkflowNode,
  type WorkflowTemplate,
} from "@/lib/marketplace/types";

import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import {
  DemoBadge,
  ModerationBadge,
  PricingBadge,
} from "@/components/marketplace/ui/TrustBadge";
import { StarRating } from "@/components/marketplace/ui/StarRating";
import { WorkflowGraphView } from "@/components/marketplace/WorkflowGraphView";
import { ReviewList } from "@/components/marketplace/ReviewList";
import { ReviewForm } from "@/components/marketplace/ReviewForm";
import { CopyWorkflowButton } from "@/components/marketplace/CopyWorkflowButton";
import { LikeButton } from "@/components/marketplace/LikeButton";
import { BookmarkButton } from "@/components/marketplace/BookmarkButton";
import { ReportButton } from "@/components/marketplace/ReportButton";
import { OpenInLedaButton } from "@/components/marketplace/OpenInLedaButton";

// ---------------------------------------------------------------------------
// Workflow detail — server component. Renders the full, honest picture of a
// declarative workflow: graph preview, trigger summary, node list, required
// plugins, risk/permissions transparency ("what it can / cannot do"), version
// history note, reviews, and the action cluster (copy, like, bookmark, report,
// open in Leda). High-risk workflows get a prominent banner.
// ---------------------------------------------------------------------------

const triggerSet = new Set<string>(TRIGGER_NODE_TYPES);

const NODE_TYPE_LABELS: Record<string, string> = {
  manual_trigger: "Manual trigger",
  schedule_trigger: "Schedule trigger",
  main_brain: "Main brain",
  call_native_plugin: "Call native plugin",
  call_dify_plugin: "Call Dify plugin",
  condition: "Condition",
  ask_confirmation: "Ask confirmation",
  wait: "Wait",
  verify_result: "Verify result",
  notify_user: "Notify user",
  end: "End",
};

function nodeTypeLabel(type: string): string {
  return NODE_TYPE_LABELS[type] ?? type;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const workflow = await getWorkflowBySlug(params.slug);
  if (!workflow) {
    return {
      title: "Workflow not found · Leda",
      description: "This workflow could not be found.",
      robots: { index: false, follow: false },
    };
  }
  const url = `/marketplace/workflows/${workflow.slug}`;
  return {
    title: `${workflow.title} · Leda Workflows`,
    description: workflow.short_description,
    alternates: { canonical: url },
    openGraph: {
      title: `${workflow.title} · Leda Workflows`,
      description: workflow.short_description,
      url,
      type: "article",
    },
  };
}

/** Human summary of how the workflow starts (its trigger node). */
function triggerSummary(workflow: WorkflowTemplate): {
  label: string;
  detail: string;
} {
  const nodes = workflow.workflow_json?.nodes ?? [];
  const trigger = nodes.find((n) => triggerSet.has(n.type));
  if (!trigger) {
    return {
      label: "Manual",
      detail: "Runs when you start it from Leda.",
    };
  }
  if (trigger.type === "schedule_trigger") {
    const cron =
      typeof trigger.config?.cron === "string"
        ? (trigger.config.cron as string)
        : null;
    return {
      label: "Scheduled",
      detail: cron
        ? `Runs on a schedule (cron: ${cron}).`
        : "Runs automatically on a schedule.",
    };
  }
  return {
    label: "Manual",
    detail: "Runs only when you start it from Leda — nothing is automatic.",
  };
}

const cardLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-ink-faint";

export default async function WorkflowDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const workflow = await getWorkflowBySlug(params.slug);
  if (!workflow) {
    notFound();
  }

  const flags = getMarketplaceFlags();
  const reviews = await listReviews("workflow", workflow.id);

  const owner = workflow.owner;
  const graph = workflow.preview_graph_json ?? workflow.workflow_json;
  const nodes: WorkflowNode[] = workflow.workflow_json?.nodes ?? [];
  const trigger = triggerSummary(workflow);
  const isHighRisk = workflow.risk_level === "high";
  const requiredPlugins = workflow.required_plugins ?? [];
  const permissions = workflow.declared_permissions ?? [];

  // "Cannot do" is honest and derived from the safe declarative model, not
  // invented per-workflow: declarative templates never run arbitrary code, and
  // the website never installs or auto-enables anything.
  const cannotDo = [
    "Run arbitrary code, executables, or scripts — it is a declarative graph only.",
    "Do anything until you copy it and explicitly enable it in Leda.",
    "Access apps or data beyond the permissions listed above.",
  ];

  return (
    <article className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-faint">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/marketplace/workflows"
              className="rounded-sm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              Workflows
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-muted">{workflow.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge risk={workflow.risk_level} />
          <PricingBadge
            model={workflow.pricing_model}
            paymentsEnabled={flags.paymentsEnabled}
          />
          <ModerationBadge status={workflow.moderation_status} />
          {workflow.is_demo ? <DemoBadge /> : null}
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {workflow.title}
          </h1>
          <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-muted">
            {workflow.short_description}
          </p>
        </div>

        {/* Rating + quick meta */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-faint">
          {workflow.rating_count > 0 ? (
            <StarRating
              value={workflow.rating_avg}
              count={workflow.rating_count}
              size={15}
            />
          ) : (
            <span>No ratings yet</span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">v{workflow.version}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            {trigger.label} trigger
          </span>
          <span className="tabular-nums">
            {workflow.copied_count.toLocaleString()} copies
          </span>
        </div>
      </header>

      {/* High-risk banner */}
      {isHighRisk ? (
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] p-4 text-sm leading-relaxed text-rose-100"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-300"
            aria-hidden
          />
          <div>
            <p className="font-semibold text-rose-200">High-risk workflow</p>
            <p className="mt-1 text-rose-100/90">
              This workflow can take sensitive actions (for example sending
              messages on your behalf). If you copy it, it is added to your Leda
              workspace <span className="font-medium">disabled by default</span>{" "}
              and stays off until you review every step and turn it on yourself.
            </p>
          </div>
        </div>
      ) : null}

      {/* Action cluster */}
      <section
        aria-label="Workflow actions"
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-surface/60 p-4 shadow-card sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <CopyWorkflowButton slug={workflow.slug} />
          <OpenInLedaButton kind="workflow" slug={workflow.slug} />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <LikeButton
            targetType="workflow"
            targetId={workflow.id}
            initialCount={workflow.like_count}
          />
          <BookmarkButton targetType="workflow" targetId={workflow.id} />
          <ReportButton targetType="workflow" targetId={workflow.id} />
        </div>
      </section>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left / main column */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Graph preview */}
          <section aria-labelledby="wf-graph-heading" className="flex flex-col gap-3">
            <h2
              id="wf-graph-heading"
              className="text-lg font-semibold text-ink"
            >
              How it works
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              {trigger.detail}
            </p>
            <WorkflowGraphView graph={graph} />
          </section>

          {/* Long description */}
          {workflow.long_description ? (
            <section
              aria-labelledby="wf-about-heading"
              className="flex flex-col gap-2.5"
            >
              <h2
                id="wf-about-heading"
                className="text-lg font-semibold text-ink"
              >
                About this workflow
              </h2>
              <p className="whitespace-pre-line text-pretty text-[15px] leading-relaxed text-ink-muted">
                {workflow.long_description}
              </p>
            </section>
          ) : null}

          {/* Node list */}
          <section aria-labelledby="wf-steps-heading" className="flex flex-col gap-3">
            <h2
              id="wf-steps-heading"
              className="flex items-center gap-2 text-lg font-semibold text-ink"
            >
              <ListChecks className="h-5 w-5 text-accent-sky" aria-hidden />
              Steps ({nodes.length})
            </h2>
            <ol className="flex flex-col gap-2">
              {nodes.map((node, index) => (
                <li
                  key={node.id}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-surface p-3"
                >
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-[12px] font-semibold tabular-nums text-ink-muted"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{node.label}</p>
                    <p className="text-[12px] text-ink-faint">
                      {nodeTypeLabel(node.type)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* What it can / cannot do */}
          <section
            aria-labelledby="wf-capabilities-heading"
            className="flex flex-col gap-3"
          >
            <h2
              id="wf-capabilities-heading"
              className="text-lg font-semibold text-ink"
            >
              What it can &amp; cannot do
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="flex flex-col gap-3 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Can do
                </h3>
                {permissions.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {permissions.map((perm) => (
                      <li
                        key={perm}
                        className="flex items-start gap-2 text-sm leading-relaxed text-ink-muted"
                      >
                        <ShieldCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80"
                          aria-hidden
                        />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">
                    Works only with the inputs you provide — no extra access is
                    declared.
                  </p>
                )}
              </Card>

              <Card className="flex flex-col gap-3 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                  <XCircle className="h-4 w-4" aria-hidden />
                  Cannot do
                </h3>
                <ul className="flex flex-col gap-2">
                  {cannotDo.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm leading-relaxed text-ink-muted"
                    >
                      <Lock
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/70"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>

          {/* Reviews */}
          <section aria-labelledby="wf-reviews-heading" className="flex flex-col gap-4">
            <h2
              id="wf-reviews-heading"
              className="text-lg font-semibold text-ink"
            >
              Reviews{" "}
              <span className="text-ink-faint">
                ({workflow.rating_count.toLocaleString()})
              </span>
            </h2>
            <ReviewList reviews={reviews} />
            <ReviewForm targetType="workflow" targetId={workflow.id} />
          </section>
        </div>

        {/* Right / sidebar column */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-36 lg:self-start">
          {/* Creator card */}
          {owner ? (
            <Card className="flex flex-col gap-3 p-4">
              <span className={cardLabelClass}>Creator</span>
              <Link
                href={`/u/${owner.handle}`}
                className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
              >
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-gradient-to-br from-accent-blue/25 to-accent-teal/20 text-sm font-semibold text-ink"
                  aria-hidden
                >
                  {(owner.display_name || owner.handle)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <span className="truncate group-hover:underline">
                      {owner.display_name}
                    </span>
                    {owner.is_verified_creator ? (
                      <BadgeCheck
                        className="h-4 w-4 shrink-0 text-accent-sky"
                        aria-label="Verified creator"
                      />
                    ) : null}
                  </span>
                  <span className="block truncate text-[13px] text-ink-muted">
                    @{owner.handle}
                  </span>
                </span>
                <ArrowUpRight
                  className="ml-auto h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Card>
          ) : null}

          {/* Trigger summary */}
          <Card className="flex flex-col gap-2 p-4">
            <span className={cardLabelClass}>Trigger</span>
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Zap className="h-4 w-4 text-accent-sky" aria-hidden />
              {trigger.label}
            </p>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              {trigger.detail}
            </p>
          </Card>

          {/* Required plugins */}
          <Card className="flex flex-col gap-3 p-4">
            <span className={cardLabelClass}>Required plugins</span>
            {requiredPlugins.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {requiredPlugins.map((plugin) => (
                  <li key={plugin.slug || plugin.name}>
                    <Link
                      href={`/marketplace/plugins/${plugin.slug}`}
                      className="group flex items-center gap-2 rounded-lg border border-white/[0.07] bg-surface px-3 py-2 text-sm text-ink-muted transition-colors hover:border-white/[0.16] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                    >
                      <Plug
                        className="h-4 w-4 shrink-0 text-accent-sky"
                        aria-hidden
                      />
                      <span className="min-w-0 truncate">{plugin.name}</span>
                      {plugin.optional ? (
                        <span className="ml-1 shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                          Optional
                        </span>
                      ) : null}
                      <ArrowUpRight
                        className="ml-auto h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                No plugins required — this workflow runs on Leda's built-in
                steps alone.
              </p>
            )}
          </Card>

          {/* Risk assessment */}
          <Card className="flex flex-col gap-3 p-4">
            <span className={cardLabelClass}>Risk assessment</span>
            <RiskBadge risk={workflow.risk_level} />
            <p className="text-[13px] leading-relaxed text-ink-muted">
              {isHighRisk
                ? "High risk — it can take sensitive actions. Copies stay disabled until you review and enable them."
                : workflow.risk_level === "medium"
                  ? "Medium risk — review the steps before enabling. Nothing runs without your action."
                  : "Low risk — limited to the inputs you provide. Still disabled until you enable it."}
            </p>
          </Card>

          {/* Tags */}
          {workflow.tags.length > 0 ? (
            <Card className="flex flex-col gap-3 p-4">
              <span className={cardLabelClass}>Tags</span>
              <ul className="flex flex-wrap gap-1.5">
                {workflow.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/marketplace/workflows?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] font-medium text-ink-muted transition-colors hover:border-white/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
                    >
                      <Tag className="h-3 w-3" aria-hidden />
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Version / history */}
          <Card className="flex flex-col gap-2 p-4">
            <span className={cardLabelClass}>Version</span>
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <GitBranch className="h-4 w-4 text-accent-sky" aria-hidden />v
              {workflow.version}
            </p>
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-faint">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Full version history will appear here once creators publish
                updates. You always copy the current published version.
              </span>
            </p>
          </Card>
        </aside>
      </div>
    </article>
  );
}
