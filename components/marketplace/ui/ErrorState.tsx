"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Error block with an optional retry action. Marked "use client" because the
// retry button is an interactive handler; renders fine even with no handler.
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
