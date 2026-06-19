"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { toggleLike } from "@/lib/marketplace/actions";
import type { TargetType } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// LikeButton — optimistic like toggle. Calls toggleLike(targetType,targetId).
// Guests get a friendly "sign in (demo)" toast and no state change.
// ---------------------------------------------------------------------------

const GUEST_TOAST = "Sign in (demo) to do that";

export function LikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked = false,
  className,
}: {
  targetType: TargetType;
  targetId: string;
  initialCount: number;
  initialLiked?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(
    Number.isFinite(initialCount) ? initialCount : 0,
  );
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }

    // Optimistic update.
    const nextLiked = !liked;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    startTransition(async () => {
      const result = await toggleLike(targetType, targetId);
      if (!result.ok) {
        // Roll back on failure.
        setLiked(prevLiked);
        setCount(prevCount);
        toast({
          title: result.message ?? GUEST_TOAST,
          variant: result.message ? "error" : "info",
        });
        return;
      }
      // Reconcile with the server's authoritative liked state when it disagrees
      // with our optimistic guess. Since they differ, the count moves one step.
      const serverLiked = result.data?.liked;
      if (typeof serverLiked === "boolean" && serverLiked !== nextLiked) {
        setLiked(serverLiked);
        setCount((c) => Math.max(0, c + (serverLiked ? 1 : -1)));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
        "disabled:cursor-not-allowed disabled:opacity-60",
        liked
          ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
          : "border-white/12 bg-white/[0.04] text-ink-muted hover:border-white/20 hover:text-ink",
        className,
      )}
    >
      <Heart
        className="h-4 w-4"
        fill={liked ? "currentColor" : "none"}
        aria-hidden
      />
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </button>
  );
}
