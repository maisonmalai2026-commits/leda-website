"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";

import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { toggleBookmark } from "@/lib/marketplace/actions";
import type { TargetType } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// BookmarkButton — optimistic bookmark toggle. Calls
// toggleBookmark(targetType,targetId). Guests get a friendly "sign in (demo)"
// toast and no state change.
// ---------------------------------------------------------------------------

const GUEST_TOAST = "Sign in (demo) to do that";

export function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked = false,
  className,
}: {
  targetType: TargetType;
  targetId: string;
  initialBookmarked?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }

    const nextBookmarked = !bookmarked;
    const prevBookmarked = bookmarked;
    setBookmarked(nextBookmarked);

    startTransition(async () => {
      const result = await toggleBookmark(targetType, targetId);
      if (!result.ok) {
        setBookmarked(prevBookmarked);
        toast({
          title: result.message ?? GUEST_TOAST,
          variant: result.message ? "error" : "info",
        });
        return;
      }
      if (
        typeof result.data?.bookmarked === "boolean" &&
        result.data.bookmarked !== nextBookmarked
      ) {
        setBookmarked(result.data.bookmarked);
      } else if (result.ok) {
        toast({
          title: nextBookmarked ? "Saved" : "Removed from saved",
          variant: "success",
        });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
        "disabled:cursor-not-allowed disabled:opacity-60",
        bookmarked
          ? "border-accent-sky/30 bg-accent-sky/10 text-accent-sky"
          : "border-white/12 bg-white/[0.04] text-ink-muted hover:border-white/20 hover:text-ink",
        className,
      )}
    >
      <Bookmark
        className="h-4 w-4"
        fill={bookmarked ? "currentColor" : "none"}
        aria-hidden
      />
      <span>{bookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}
