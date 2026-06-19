import type { Metadata } from "next";
import { Workflow as WorkflowIcon } from "lucide-react";

import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { listCategories, listWorkflows } from "@/lib/marketplace/data";
import {
  RISK_LEVEL,
  SKILL_LEVEL,
  TRUST_STATUS,
  type RiskLevel,
  type SkillLevel,
  type TrustStatus,
  type WorkflowFilter,
  type WorkflowSort,
  type WorkflowTemplate,
} from "@/lib/marketplace/types";
import { WorkflowCard } from "@/components/marketplace/WorkflowCard";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { SectionHeading } from "@/components/ui/Card";
import {
  WorkflowFilters,
  type WorkflowFilterParams,
} from "./WorkflowFilters";

// ---------------------------------------------------------------------------
// Workflow gallery — server component. Reads filters from the URL searchParams,
// resolves them into a type-safe WorkflowFilter, fetches via listWorkflows, and
// renders the client filter toolbar + a responsive grid of WorkflowCards.
//
// Honesty note: the data facade's applyWorkflowFilter does not implement the
// "status" (available/coming_soon) or "trust" (source) facets for workflows, so
// we apply those here against real fields (moderation_status + the owner's
// verified-creator flag) rather than silently ignoring the URL params.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Workflow Marketplace · Leda",
  description:
    "Browse safe, declarative Leda workflows. Filter by category, skill, trigger, and risk — every workflow stays disabled until you review and enable it.",
  alternates: { canonical: "/marketplace/workflows" },
  openGraph: {
    title: "Workflow Marketplace · Leda",
    description:
      "Browse safe, declarative Leda workflows. Copy any to your private workspace — nothing runs automatically.",
    url: "/marketplace/workflows",
    type: "website",
  },
};

const SORT_VALUES: WorkflowSort[] = [
  "trending",
  "newest",
  "most_copied",
  "highest_rated",
  "editors_picks",
];

type SearchParams = Record<string, string | string[] | undefined>;

/** First value of a possibly-array searchParam, trimmed and non-empty. */
function one(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function asEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function asTrigger(
  value: string | undefined,
): "manual" | "scheduled" | undefined {
  return value === "manual" || value === "scheduled" ? value : undefined;
}

function asStatus(
  value: string | undefined,
): "available" | "coming_soon" | undefined {
  return value === "available" || value === "coming_soon" ? value : undefined;
}

export default async function WorkflowGalleryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const flags = getMarketplaceFlags();

  // Resolve raw params (everything that round-trips to the client toolbar).
  const q = one(searchParams.q);
  const category = one(searchParams.category);
  const tag = one(searchParams.tag);
  const tool = one(searchParams.tool);
  const skill = asEnum<SkillLevel>(one(searchParams.skill_level), SKILL_LEVEL);
  const trigger = asTrigger(one(searchParams.trigger));
  const risk = asEnum<RiskLevel>(one(searchParams.risk_level), RISK_LEVEL);
  const trust = asEnum<TrustStatus>(one(searchParams.trust), TRUST_STATUS);
  const status = asStatus(one(searchParams.status));
  const sort = asEnum<WorkflowSort>(one(searchParams.sort), SORT_VALUES);

  // Build the data-facade filter from the supported keys.
  const filter: WorkflowFilter = {
    query: q,
    category,
    tag,
    tool,
    skill_level: skill,
    trigger,
    risk_level: risk,
    sort,
  };

  let workflows: WorkflowTemplate[] = await listWorkflows(filter);

  // Apply the facets the facade doesn't cover, against real fields only.
  if (status) {
    workflows = workflows.filter((w) =>
      status === "available"
        ? w.moderation_status === "approved" && w.visibility === "public"
        : w.moderation_status !== "approved",
    );
  }
  if (trust) {
    // "Source" maps to the owner's verified-creator flag (official/verified are
    // verified creators; community is everyone else). No fabricated trust tiers.
    workflows = workflows.filter((w) => {
      const verified = w.owner?.is_verified_creator ?? false;
      return trust === "community" ? !verified : verified;
    });
  }

  const categories = await listCategories("workflow");

  const params: WorkflowFilterParams = {
    q,
    category,
    skill_level: skill,
    trigger,
    risk_level: risk,
    status,
    trust,
    sort,
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Marketplace"
        title="Workflows"
        description="Declarative, human-reviewed automations for Leda. Copy any workflow to your private workspace — it stays disabled until you review and enable it yourself."
      />

      <WorkflowFilters params={params} categories={categories} />

      <section aria-label="Workflow results">
        <p
          className="mb-4 text-[13px] text-ink-faint"
          role="status"
          aria-live="polite"
        >
          {workflows.length}{" "}
          {workflows.length === 1 ? "workflow" : "workflows"}
        </p>

        {workflows.length === 0 ? (
          <EmptyState
            icon={WorkflowIcon}
            title="No workflows match these filters"
            description="Try widening your search or clearing a filter — every published workflow is free while the marketplace is in demo mode."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <li key={workflow.id} className="h-full">
                <WorkflowCard workflow={workflow} flags={flags} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
