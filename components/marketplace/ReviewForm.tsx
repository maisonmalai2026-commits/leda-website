"use client";

import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { RatingInput } from "@/components/marketplace/ui/StarRating";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { submitReview } from "@/lib/marketplace/actions";
import type { TargetType } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// ReviewForm — RatingInput + textarea. Calls submitReview. Uses useToast.
// When the visitor is a guest (no demo cookie), the form is disabled and a
// sign-in hint is shown instead of letting them submit.
// ---------------------------------------------------------------------------

const MAX_BODY = 1000;
const GUEST_TOAST = "Sign in (demo) to do that";

export function ReviewForm({
  targetType,
  targetId,
}: {
  targetType: TargetType;
  targetId: string;
}) {
  const { toast } = useToast();
  const { isSignedIn, ready } = useDemoIdentity();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const bodyId = useId();
  const ratingId = useId();

  // Treat as "guest" until the cookie is read, but only show the disabled hint
  // after we've confirmed (avoids a flash for signed-in users on hydration).
  const guest = ready && !isSignedIn;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }
    if (rating < 1) {
      toast({
        title: "Add a star rating",
        description: "Pick 1 to 5 stars before submitting.",
        variant: "info",
      });
      return;
    }

    startTransition(async () => {
      const result = await submitReview({
        targetType,
        targetId,
        rating,
        body: body.trim(),
      });
      if (!result.ok) {
        toast({
          title: result.message ?? "Could not submit your review",
          description:
            result.error ?? result.issues?.[0]?.message ?? undefined,
          variant: "error",
        });
        return;
      }
      toast({
        title: result.message ?? "Review submitted",
        variant: "success",
      });
      setRating(0);
      setBody("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/[0.08] bg-surface p-5 shadow-card"
      aria-label="Write a review"
    >
      <h3 className="text-base font-semibold text-ink">Write a review</h3>

      {guest ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Sign in (demo) from the account menu to leave a review. Your demo
          identity drives this just like the real app would.
        </p>
      ) : null}

      <div className="mt-4">
        <label
          htmlFor={ratingId}
          className="mb-1.5 block text-sm font-medium text-ink-muted"
        >
          Your rating
        </label>
        <RatingInput
          value={rating}
          onChange={setRating}
          name={ratingId}
          className={guest ? "pointer-events-none opacity-50" : undefined}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor={bodyId}
          className="mb-1.5 block text-sm font-medium text-ink-muted"
        >
          Your review{" "}
          <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          disabled={guest || pending}
          rows={4}
          maxLength={MAX_BODY}
          placeholder="What worked well? Anything to watch out for?"
          className="w-full resize-y rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent-sky/40 focus:outline-none focus:ring-2 focus:ring-accent-sky/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-ink-faint">
          {body.length}/{MAX_BODY}
        </p>
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="submit" variant="primary" disabled={guest || pending}>
          {pending ? "Submitting…" : "Submit review"}
        </Button>
      </div>
    </form>
  );
}
