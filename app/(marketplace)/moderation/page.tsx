import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Hourglass,
  Flag,
  KeyRound,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  UserCog,
  Workflow as WorkflowIcon,
  Plug,
  Info,
} from "lucide-react";

import { requireRole } from "@/lib/marketplace/auth";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { listPlugins, listWorkflows } from "@/lib/marketplace/data";
import { validateWorkflowGraph } from "@/lib/marketplace/validation/workflow";
import { validatePluginListing } from "@/lib/marketplace/validation/plugin";
import type {
  PluginListing,
  TargetType,
  ValidationResult,
  WorkflowTemplate,
} from "@/lib/marketplace/types";
import { WorkflowGraphView } from "@/components/marketplace/WorkflowGraphView";
import { DemoBadge, ModerationBadge, TrustBadge } from "@/components/marketplace/ui/TrustBadge";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { RiskBadge, Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import { ModerationActions } from "./ModerationActions";

export const metadata: Metadata = {
  title: "Moderation queue · Leda Marketplace",
  description:
    "Human review queue for pending and reported marketplace content. No AI auto-approval — a moderator action is always required.",
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------------
// Demo queue synthesis.
//
// There is no real submissions/reports table in demo mode. To exercise the
// queue honestly we take the first couple of approved seed items and present
// them *as if* they were awaiting review or had been reported. Every synthesized
// entry is clearly labeled "Demo" and the reason text says so plainly — we never
// imply these are real user submissions or real reports.
// ---------------------------------------------------------------------------

type QueueReason = "pending" | "reported";

interface WorkflowQueueItem {
  kind: "workflow";
  reason: QueueReason;
  reportNote?: string;
  item: WorkflowTemplate;
  validation: ValidationResult;
}

interface PluginQueueItem {
  kind: "plugin";
  reason: QueueReason;
  reportNote?: string;
  item: PluginListing;
  validation: ValidationResult;
}

type QueueItem = WorkflowQueueItem | PluginQueueItem;

async function buildDemoQueue(): Promise<QueueItem[]> {
  const [workflows, plugins] = await Promise.all([
    listWorkflows(),
    listPlugins(),
  ]);

  const queue: QueueItem[] = [];

  // Treat the first two workflows as "pending review" and "reported".
  workflows.slice(0, 2).forEach((wf, i) => {
    queue.push({
      kind: "workflow",
      reason: i === 1 ? "reported" : "pending",
      reportNote:
        i === 1
          ? "Demo report: flagged for review of declared permissions."
          : undefined,
      item: wf,
      validation: validateWorkflowGraph(wf.workflow_json),
    });
  });

  // Treat the first two plugins as "pending review" and "reported".
  plugins.slice(0, 2).forEach((pl, i) => {
    queue.push({
      kind: "plugin",
      reason: i === 1 ? "reported" : "pending",
      reportNote:
        i === 1
          ? "Demo report: requesting verification of required-app permissions."
          : undefined,
      // The validator expects the submission shape with a confirmation flag; the
      // approved seed listings are well-formed, so confirm to validate metadata.
      item: pl,
      validation: validatePluginListing(pl, { confirmed: true }),
    });
  });

  return queue;
}

// ---------------------------------------------------------------------------
// Small presentational helpers.
// ---------------------------------------------------------------------------

function PermissionList({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "danger";
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <KeyRound className="h-3.5 w-3.5" aria-hidden />
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-[13px] text-ink-faint">None declared.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((perm) => (
            <li key={perm}>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium",
                  tone === "danger"
                    ? "border-rose-400/25 bg-rose-400/[0.07] text-rose-200/90"
                    : "border-white/10 bg-white/[0.04] text-ink-muted",
                )}
              >
                {perm}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ValidationSummary({ validation }: { validation: ValidationResult }) {
  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <ListChecks className="h-3.5 w-3.5" aria-hidden />
        Automated validation
      </p>
      {validation.ok ? (
        <p className="flex items-center gap-1.5 text-[13px] text-emerald-300">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Passes safety validation
          {warnings.length > 0 ? ` · ${warnings.length} warning(s)` : ""}.
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-[13px] text-rose-300">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {errors.length} blocking issue(s) found.
        </p>
      )}
      {validation.issues.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {validation.issues.map((issue, idx) => (
            <li
              key={`${issue.code}-${idx}`}
              className="flex items-start gap-2 text-[12px] leading-relaxed"
            >
              <span
                className={cn(
                  "mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                  issue.severity === "error" ? "bg-rose-400" : "bg-amber-400",
                )}
                aria-hidden
              />
              <span className="text-ink-muted">
                <span className="font-mono text-ink-faint">{issue.code}</span>
                {issue.path ? (
                  <span className="text-ink-faint"> · {issue.path}</span>
                ) : null}
                {" — "}
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
        Validation is an aid only. A human moderator must make the final call.
      </p>
    </div>
  );
}

function ReasonTag({ reason }: { reason: QueueReason }) {
  if (reason === "reported") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-200">
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Reported
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
      <Hourglass className="h-3.5 w-3.5" aria-hidden />
      Pending review
    </span>
  );
}

function QueueCard({ entry }: { entry: QueueItem }) {
  const isWorkflow = entry.kind === "workflow";
  const item = entry.item;
  const title = isWorkflow
    ? (entry.item as WorkflowTemplate).title
    : (entry.item as PluginListing).name;
  const handle = item.owner?.handle ?? "unknown";
  const targetType: TargetType = entry.kind;
  // Server actions match on slug for workflows/plugins (see resolveTargetOwnerId).
  const targetId = item.slug;

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium",
                isWorkflow
                  ? "border-accent-blue/25 bg-accent-blue/10 text-accent-sky"
                  : "border-accent-teal/25 bg-accent-teal/10 text-accent-teal",
              )}
            >
              {isWorkflow ? (
                <WorkflowIcon className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Plug className="h-3.5 w-3.5" aria-hidden />
              )}
              {isWorkflow ? "Workflow" : "Plugin"}
            </span>
            <ReasonTag reason={entry.reason} />
            {item.is_demo ? <DemoBadge /> : null}
          </div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="text-[13px] text-ink-muted">
            by{" "}
            <Link
              href={`/u/${handle}`}
              className="text-ink hover:text-accent-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              @{handle}
            </Link>{" "}
            · v{item.version}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModerationBadge status={item.moderation_status} />
          {isWorkflow ? (
            <RiskBadge risk={(entry.item as WorkflowTemplate).risk_level} />
          ) : (
            <TrustBadge status={(entry.item as PluginListing).trust_status} />
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">
        {item.short_description}
      </p>

      {entry.reportNote ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.05] px-3.5 py-2.5 text-[13px] text-rose-200/90">
          <Flag className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{entry.reportNote}</span>
        </div>
      ) : null}

      {/* Preview */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Preview
        </p>
        {isWorkflow ? (
          <WorkflowGraphView
            graph={
              (entry.item as WorkflowTemplate).preview_graph_json ??
              (entry.item as WorkflowTemplate).workflow_json
            }
          />
        ) : (
          <PluginPreview plugin={entry.item as PluginListing} />
        )}
      </div>

      {/* Permission declarations */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PermissionList
          title="Declared permissions"
          items={item.declared_permissions}
        />
        {isWorkflow ? (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <Plug className="h-3.5 w-3.5" aria-hidden />
              Required plugins
            </p>
            {(entry.item as WorkflowTemplate).required_plugins.length === 0 ? (
              <p className="text-[13px] text-ink-faint">None.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {(entry.item as WorkflowTemplate).required_plugins.map((p) => (
                  <li key={p.slug}>
                    <Pill>
                      {p.name}
                      {p.optional ? " · optional" : ""}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <PermissionList
            title="Cannot access"
            items={(entry.item as PluginListing).cannot_access}
            tone="danger"
          />
        )}
      </div>

      <ValidationSummary validation={entry.validation} />

      <div className="border-t border-white/[0.06] pt-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Moderation decision
        </p>
        <ModerationActions
          targetType={targetType}
          targetId={targetId}
          targetLabel={title}
        />
      </div>
    </Card>
  );
}

function PluginPreview({ plugin }: { plugin: PluginListing }) {
  return (
    <div className="grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:grid-cols-2">
      <MetaRow label="Category" value={plugin.category?.name ?? plugin.category_id} />
      <MetaRow
        label="Installation model"
        value={plugin.installation_model.replace(/_/g, " ")}
      />
      <MetaRow
        label="Required apps"
        value={plugin.required_apps.length ? plugin.required_apps.join(", ") : "None"}
      />
      <MetaRow
        label="Compatibility"
        value={plugin.compatibility.length ? plugin.compatibility.join(", ") : "—"}
      />
      <MetaRow
        label="Source"
        value={plugin.source_url ?? "Not provided"}
      />
      <MetaRow
        label="Documentation"
        value={plugin.documentation_url ?? "Not provided"}
      />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd className="truncate text-[13px] text-ink-muted" title={value}>
        {value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ModerationPage() {
  const mod = await requireRole("moderator");
  const flags = getMarketplaceFlags();

  // Accessible gate — never redirect, never crash.
  if (!mod) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={UserCog}
          title="Moderators only"
          description={
            flags.demoMode
              ? "This is the human review queue. Switch your Demo identity to “Moderator” (or Admin) using the account menu above to explore it."
              : "You need a moderator role to view the review queue. Ask an admin for access."
          }
          action={
            <ButtonLink href="/marketplace" variant="secondary">
              Back to marketplace
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const queue = await buildDemoQueue();
  const pendingCount = queue.filter((q) => q.reason === "pending").length;
  const reportedCount = queue.filter((q) => q.reason === "reported").length;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-sky/30 bg-accent-sky/10 text-accent-sky">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Moderation queue
            </h1>
            <p className="text-sm text-ink-muted">
              Signed in as{" "}
              <span className="text-ink">{mod.profile.display_name}</span> ·{" "}
              {mod.role}
            </p>
          </div>
        </div>

        <div
          role="note"
          className="flex items-start gap-2.5 rounded-xl border border-accent-sky/20 bg-accent-sky/[0.06] px-4 py-3 text-[13px] leading-relaxed text-ink-muted"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" aria-hidden />
          <p>
            <span className="font-medium text-ink">No AI auto-approval.</span>{" "}
            Every publish/reject decision requires an explicit human moderator
            action. AI may assist with summaries only.
            {flags.demoMode
              ? " In demo mode the queue below is synthesized from seed content and clearly labeled — decisions are recorded to the audit log but not persisted."
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill className="border-amber-400/30 bg-amber-400/10 text-amber-300">
            <Hourglass className="h-3.5 w-3.5" aria-hidden />
            {pendingCount} pending
          </Pill>
          <Pill className="border-rose-400/25 bg-rose-400/10 text-rose-200">
            <Flag className="h-3.5 w-3.5" aria-hidden />
            {reportedCount} reported
          </Pill>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
          >
            <UserCog className="h-3.5 w-3.5" aria-hidden />
            Admin dashboard
          </Link>
        </div>
      </header>

      {queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Queue is clear"
          description="There is no pending or reported content to review right now."
        />
      ) : (
        <div className="space-y-6">
          {queue.map((entry) => (
            <QueueCard key={`${entry.kind}-${entry.item.id}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
