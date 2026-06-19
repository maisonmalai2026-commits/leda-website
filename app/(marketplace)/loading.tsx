import { SkeletonGrid } from "@/components/marketplace/ui/LoadingSkeleton";

// Route-group loading UI. Shown during navigation/streaming under (marketplace).
export default function MarketplaceLoading() {
  return (
    <div>
      <span className="sr-only" role="status" aria-live="polite">
        Loading marketplace…
      </span>
      <div className="mb-6 space-y-2" aria-hidden>
        <div className="h-7 w-56 animate-pulse rounded-md bg-white/[0.06]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-white/[0.05]" />
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}
