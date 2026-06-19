import {
  BadgeCheck,
  ShieldCheck,
  Users,
  FlaskConical,
  XCircle,
  Archive,
  Clock,
  FileEdit,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  Ban,
  EyeOff,
  Gift,
  CreditCard,
  Sparkles,
  PackageOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  TrustStatus,
  ModerationStatus,
  PricingModel,
} from "@/lib/marketplace/types";

// Shared visual language reused from @/components/ui/Badge: pill shapes,
// border + tinted background + matching text color, optional leading icon.
const pill =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";

const iconClass = "h-3.5 w-3.5 shrink-0";

// ---------------------------------------------------------------------------
// TrustBadge
// ---------------------------------------------------------------------------

const trustStyles: Record<
  TrustStatus,
  { box: string; label: string; Icon: typeof BadgeCheck }
> = {
  official: {
    box: "border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
    label: "Official",
    Icon: BadgeCheck,
  },
  verified: {
    box: "border-accent-sky/30 bg-accent-sky/10 text-accent-sky",
    label: "Verified",
    Icon: ShieldCheck,
  },
  community: {
    box: "border-white/12 bg-white/[0.04] text-ink-muted",
    label: "Community",
    Icon: Users,
  },
  experimental: {
    box: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    label: "Experimental",
    Icon: FlaskConical,
  },
  rejected: {
    box: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    label: "Rejected",
    Icon: XCircle,
  },
  deprecated: {
    box: "border-white/10 bg-white/[0.03] text-ink-faint",
    label: "Deprecated",
    Icon: Archive,
  },
  coming_soon: {
    box: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    label: "Coming soon",
    Icon: Clock,
  },
};

export function TrustBadge({
  status,
  className,
}: {
  status: TrustStatus;
  className?: string;
}) {
  const s = trustStyles[status];
  const Icon = s.Icon;
  return (
    <span className={cn(pill, s.box, className)}>
      <Icon className={iconClass} aria-hidden />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ModerationBadge
// ---------------------------------------------------------------------------

const moderationStyles: Record<
  ModerationStatus,
  { box: string; label: string; Icon: typeof FileEdit }
> = {
  draft: {
    box: "border-white/12 bg-white/[0.04] text-ink-muted",
    label: "Draft",
    Icon: FileEdit,
  },
  pending: {
    box: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    label: "Pending review",
    Icon: Hourglass,
  },
  approved: {
    box: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    label: "Approved",
    Icon: CheckCircle2,
  },
  changes_requested: {
    box: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    label: "Changes requested",
    Icon: AlertTriangle,
  },
  rejected: {
    box: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    label: "Rejected",
    Icon: XCircle,
  },
  deprecated: {
    box: "border-white/10 bg-white/[0.03] text-ink-faint",
    label: "Deprecated",
    Icon: Archive,
  },
  removed: {
    box: "border-rose-400/20 bg-rose-400/[0.06] text-rose-300/90",
    label: "Removed",
    Icon: Ban,
  },
};

export function ModerationBadge({
  status,
  className,
}: {
  status: ModerationStatus;
  className?: string;
}) {
  const s = moderationStyles[status];
  const Icon = s.Icon;
  return (
    <span className={cn(pill, s.box, className)}>
      <Icon className={iconClass} aria-hidden />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// PricingBadge
// ---------------------------------------------------------------------------

const pricingLabels: Record<PricingModel, string> = {
  free: "Free",
  one_time: "One-time",
  subscription: "Subscription",
  donation: "Donation",
};

export function PricingBadge({
  model,
  paymentsEnabled = false,
  className,
}: {
  model: PricingModel;
  paymentsEnabled?: boolean;
  className?: string;
}) {
  const isFree = model === "free";
  // While payments are disabled, every paid model is surfaced as "coming later"
  // so we never imply a purchase is possible.
  if (isFree) {
    return (
      <span
        className={cn(
          pill,
          "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
          className,
        )}
      >
        <Gift className={iconClass} aria-hidden />
        Free
      </span>
    );
  }

  if (!paymentsEnabled) {
    return (
      <span
        className={cn(
          pill,
          "border-white/12 bg-white/[0.04] text-ink-muted",
          className,
        )}
      >
        <Clock className={iconClass} aria-hidden />
        Paid · coming later
      </span>
    );
  }

  return (
    <span
      className={cn(
        pill,
        "border-accent-blue/30 bg-accent-blue/10 text-accent-sky",
        className,
      )}
    >
      <CreditCard className={iconClass} aria-hidden />
      {pricingLabels[model]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// DemoBadge — marks seed/demo content. Always visibly labeled "Demo".
// ---------------------------------------------------------------------------

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        pill,
        "border-accent-sky/30 bg-accent-sky/10 text-accent-sky",
        className,
      )}
      title="Demo content — not a real user submission"
    >
      <Sparkles className={iconClass} aria-hidden />
      Demo
    </span>
  );
}

// ---------------------------------------------------------------------------
// ListingOnlyBadge — metadata-only plugin listings.
// ---------------------------------------------------------------------------

export function ListingOnlyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        pill,
        "border-white/12 bg-white/[0.04] text-ink-muted",
        className,
      )}
    >
      <PackageOpen className={iconClass} aria-hidden />
      Listing only — not installable in Leda yet
    </span>
  );
}

// Re-exported helper for places that want a neutral hidden-content marker.
export function HiddenBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        pill,
        "border-white/10 bg-white/[0.03] text-ink-faint",
        className,
      )}
    >
      <EyeOff className={iconClass} aria-hidden />
      Hidden
    </span>
  );
}
