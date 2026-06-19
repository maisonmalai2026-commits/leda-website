import { cn } from "@/lib/cn";
import {
  type PluginBadge,
  type RiskLevel,
  type Status,
  riskLabels,
  statusLabels,
} from "@/lib/content";

const dot = "h-1.5 w-1.5 rounded-full";

const statusStyles: Record<Status, { box: string; dot: string }> = {
  available: {
    box: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  "in-development": {
    box: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  "coming-soon": {
    box: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    dot: "bg-sky-400",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        s.box,
      )}
    >
      <span className={cn(dot, s.dot)} aria-hidden />
      {statusLabels[status]}
    </span>
  );
}

const badgeStyles: Record<PluginBadge, string> = {
  official: "border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
  experimental: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "in-development": "border-sky-400/30 bg-sky-400/10 text-sky-300",
};

const badgeLabels: Record<PluginBadge, string> = {
  official: "Official",
  experimental: "Experimental",
  "in-development": "In development",
};

export function PluginTypeBadge({ badge }: { badge: PluginBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        badgeStyles[badge],
      )}
    >
      {badgeLabels[badge]}
    </span>
  );
}

const riskStyles: Record<RiskLevel, string> = {
  low: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300/90",
  medium: "border-amber-400/20 bg-amber-400/5 text-amber-300/90",
  high: "border-rose-400/25 bg-rose-400/10 text-rose-300",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        riskStyles[risk],
      )}
    >
      {riskLabels[risk]}
    </span>
  );
}

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
