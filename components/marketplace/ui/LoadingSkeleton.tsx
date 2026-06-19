import { cn } from "@/lib/cn";

// Shimmer blocks built purely from CSS (animate-pulse). No images, no network.
// `aria-hidden` so screen readers don't announce skeletal placeholders; pair
// with an aria-live "Loading…" region at the page level if needed.

const block = "rounded-md bg-white/[0.06]";

export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = "60%",
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div
      className={cn("animate-pulse space-y-2.5", className)}
      aria-hidden
    >
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <div
            key={i}
            className={cn(block, "h-3")}
            style={isLast ? { width: lastLineWidth } : undefined}
          />
        );
      })}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-white/[0.08] bg-surface p-6 shadow-card",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-3">
        <div className={cn(block, "h-10 w-10 rounded-xl")} />
        <div className="flex-1 space-y-2">
          <div className={cn(block, "h-3.5 w-1/2")} />
          <div className={cn(block, "h-3 w-1/3")} />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className={cn(block, "h-3 w-full")} />
        <div className={cn(block, "h-3 w-full")} />
        <div className={cn(block, "h-3 w-2/3")} />
      </div>
      <div className="mt-5 flex gap-2">
        <div className={cn(block, "h-6 w-16 rounded-full")} />
        <div className={cn(block, "h-6 w-20 rounded-full")} />
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
