"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";

import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { toggleFollow } from "@/lib/marketplace/actions";

// ---------------------------------------------------------------------------
// FollowButton — optimistic follow toggle. Calls toggleFollow(creatorId).
// Guests get a friendly "sign in (demo)" toast and no state change.
// ---------------------------------------------------------------------------

const GUEST_TOAST = "Sign in (demo) to do that";

export function FollowButton({
  creatorId,
  initialFollowing = false,
  className,
}: {
  creatorId: string;
  initialFollowing?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }

    const nextFollowing = !following;
    const prevFollowing = following;
    setFollowing(nextFollowing);

    startTransition(async () => {
      const result = await toggleFollow(creatorId);
      if (!result.ok) {
        setFollowing(prevFollowing);
        toast({
          title: result.message ?? GUEST_TOAST,
          variant: result.message ? "error" : "info",
        });
        return;
      }
      if (
        typeof result.data?.following === "boolean" &&
        result.data.following !== nextFollowing
      ) {
        setFollowing(result.data.following);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={following}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
        "disabled:cursor-not-allowed disabled:opacity-60",
        following
          ? "border-accent-teal/30 bg-accent-teal/10 text-accent-teal"
          : "border-white/12 bg-white/[0.06] text-ink hover:border-white/20 hover:bg-white/[0.10]",
        className,
      )}
    >
      {following ? (
        <UserCheck className="h-4 w-4" aria-hidden />
      ) : (
        <UserPlus className="h-4 w-4" aria-hidden />
      )}
      <span>{following ? "Following" : "Follow"}</span>
    </button>
  );
}
