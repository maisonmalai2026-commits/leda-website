import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/marketplace/auth";
import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { listCategories } from "@/lib/marketplace/data";
import { SectionHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";

import { PluginForm } from "./PluginForm";

// ---------------------------------------------------------------------------
// /creator/submit/plugin — server gate + client metadata-only form.
//
// SERVER component: checks requireRole("creator"); renders an accessible gate
// when not allowed. Otherwise it loads the plugin categories and renders the
// client <PluginForm/>. The form collects LISTING METADATA ONLY — there are no
// file/code upload fields. submitPluginListing re-checks the role and re-runs
// the plugin validator with the required confirmation flag.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Submit a plugin listing — Leda Marketplace",
  description:
    "List a plugin in the Leda Marketplace. Metadata only — no code or executables are uploaded.",
  alternates: { canonical: "/creator/submit/plugin" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Submit a plugin listing — Leda Marketplace",
    description:
      "List a plugin in the Leda Marketplace. Metadata only — no code or executables are uploaded.",
    url: "/creator/submit/plugin",
    type: "website",
  },
};

export default async function SubmitPluginPage() {
  const user = await requireRole("creator");
  const flags = getMarketplaceFlags();

  if (!user) {
    return (
      <div className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="For creators"
          title="Submit a plugin listing"
          description="Add a metadata-only plugin listing for review."
        />
        <EmptyState
          icon={ShieldCheck}
          title="Creator access required"
          description={
            flags.demoMode
              ? "Only creators can submit plugin listings. In demo mode, open the account menu in the top bar and switch your demo identity to “Creator” to use this form."
              : "Only creators can submit plugin listings. Sign in as a creator to continue."
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

  const categories = await listCategories("plugin");
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="For creators"
        title="Submit a plugin listing"
        description="Describe your plugin so people can discover it. This is metadata only — the marketplace never accepts code, packages, or executable uploads. A reviewer approves listings before they go live."
      />
      <PluginForm categories={categoryOptions} />
    </div>
  );
}
