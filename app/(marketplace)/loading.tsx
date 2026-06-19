import { SkeletonGrid } from "@/components/marketplace/ui/LoadingSkeleton";

// Route-group loading UI. Shown during navigation/streaming under (marketplace).
export default function MarketplaceLoading() {
  return (
    <div>
      <span className="sr-only" role="status" aria-live="polite">
        Loading marketplace…
      </span>

      {/* Hero placeholder — mirrors the home hero panel for a smooth handoff. */}
      <div
        className="relative mb-12 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-12 sm:px-10 sm:py-16"
        aria-hidden
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="relative max-w-3xl animate-pulse space-y-4">
          <div className="h-6 w-32 rounded-full bg-white/[0.06]" />
          <div className="h-11 w-3/4 rounded-lg bg-white/[0.07]" />
          <div className="h-4 w-1/2 rounded-md bg-white/[0.05]" />
          <div className="mt-2 h-11 w-full max-w-xl rounded-xl bg-white/[0.05]" />
        </div>
      </div>

      <div className="mb-6 space-y-2" aria-hidden>
        <div className="h-7 w-56 animate-pulse rounded-md bg-white/[0.06]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-white/[0.05]" />
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}
