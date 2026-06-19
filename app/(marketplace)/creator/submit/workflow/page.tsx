import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/marketplace/auth";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { SectionHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";

import { WorkflowWizard } from "./WorkflowWizard";

// ---------------------------------------------------------------------------
// /creator/submit/workflow — server gate + client wizard.
//
// The page is a SERVER component that checks requireRole("creator"). When the
// viewer is not a creator we render an accessible gate (EmptyState). When
// allowed we render the client-side multi-step <WorkflowWizard/>, which runs
// the shared validator for inline feedback and calls submitWorkflowDraft on
// submit. The server action independently re-checks the role + re-validates.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Submit a workflow — Leda Marketplace",
  description:
    "Create and validate a declarative workflow template, then submit it for human review on the Leda Marketplace.",
  alternates: { canonical: "/creator/submit/workflow" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Submit a workflow — Leda Marketplace",
    description:
      "Create and validate a declarative workflow template, then submit it for human review.",
    url: "/creator/submit/workflow",
    type: "website",
  },
};

export default async function SubmitWorkflowPage() {
  const user = await requireRole("creator");
  const flags = getMarketplaceFlags();

  if (!user) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="For creators"
          title="Submit a workflow template"
          description="Validate a declarative workflow and send it for review."
        />
        <EmptyState
          icon={ShieldCheck}
          title="Creator access required"
          description={
            flags.demoMode
              ? "Only creators can submit workflow templates. In demo mode, open the account menu in the top bar and switch your demo identity to “Creator” to use this wizard."
              : "Only creators can submit workflow templates. Sign in as a creator to continue."
          }
          action={
            <ButtonLink href="/creator/dashboard" variant="secondary">
              Go to creator dashboard
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="For creators"
        title="Submit a workflow template"
        description="Build a declarative workflow, validate it against every safety rule, and submit it for human review. Nothing runs on your machine — the graph is only checked for structure."
      />
      <WorkflowWizard />
    </div>
  );
}
