"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/marketplace/ui/ErrorState";

// Route-group error boundary for the marketplace. Catches render/data errors in
// any nested segment and offers a retry via reset().
export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the console for local debugging.
    // eslint-disable-next-line no-console
    console.error("[marketplace] route error:", error);
  }, [error]);

  return (
    <ErrorState
      title="This page didn't load"
      description="Something went wrong while loading the marketplace. You can try again."
      onRetry={reset}
      className="my-6"
    />
  );
}
