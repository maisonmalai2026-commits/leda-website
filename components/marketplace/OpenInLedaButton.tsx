"use client";

import { useState } from "react";
import { MonitorDown, Info } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import type { TrustStatus } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// OpenInLedaButton — shows the correct desktop-state message. The website never
// installs or executes anything; it only points people at the desktop app and
// is honest about what is (and isn't) supported yet.
//
// Messages (exact, per contract):
//   workflow:
//     "Open Leda on your computer to use this workflow."
//   plugin, Official / Verified:
//     "Desktop installation support is coming soon. This listing has been reviewed."
//   plugin, Community / Experimental (or anything else):
//     "Listing only. Community code is not automatically installed."
// ---------------------------------------------------------------------------

const WORKFLOW_MESSAGE = "Open Leda on your computer to use this workflow.";
const PLUGIN_REVIEWED_MESSAGE =
  "Desktop installation support is coming soon. This listing has been reviewed.";
const PLUGIN_COMMUNITY_MESSAGE =
  "Listing only. Community code is not automatically installed.";

/** True for the reviewed/trusted plugin tiers (official + verified). */
function isReviewedTier(trust: TrustStatus | undefined): boolean {
  return trust === "official" || trust === "verified";
}

export function OpenInLedaButton({
  kind,
  slug,
  trustStatus,
  className,
}: {
  kind: "workflow" | "plugin";
  slug: string;
  trustStatus?: TrustStatus;
  className?: string;
}) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);

  const message =
    kind === "workflow"
      ? WORKFLOW_MESSAGE
      : isReviewedTier(trustStatus)
        ? PLUGIN_REVIEWED_MESSAGE
        : PLUGIN_COMMUNITY_MESSAGE;

  const label = "Open in Leda";

  function handleClick() {
    setRevealed(true);
    toast({
      title: label,
      description: message,
      variant: "info",
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        variant="secondary"
        onClick={handleClick}
        aria-describedby={revealed ? `${slug}-leda-state` : undefined}
      >
        <MonitorDown className="h-4 w-4" aria-hidden />
        {label}
      </Button>

      {revealed ? (
        <p
          id={`${slug}-leda-state`}
          role="status"
          className="inline-flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] leading-relaxed text-ink-muted"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" aria-hidden />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}
