import { MessageSquare } from "lucide-react";

import { StarRating } from "@/components/marketplace/ui/StarRating";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import type { MarketplaceReview } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// ReviewList — server component. Presentational only. Renders the list of
// reviews (only those with moderation_status === "visible") with a StarRating,
// the author handle, and the review body. Shows an EmptyState when there are no
// visible reviews.
// ---------------------------------------------------------------------------

function authorLabel(review: MarketplaceReview): string {
  const author = review.author;
  if (author?.handle) return `@${author.handle}`;
  if (author?.display_name) return author.display_name;
  return "Anonymous";
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewList({ reviews }: { reviews: MarketplaceReview[] }) {
  const visible = (reviews ?? []).filter(
    (r) => r.moderation_status === "visible",
  );

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No reviews yet"
        description="Be the first to share how this worked for you."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Reviews">
      {visible.map((review) => {
        const date = formatDate(review.created_at);
        return (
          <li
            key={review.id}
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E18]/70 p-4 shadow-card backdrop-blur-[2px] transition-colors hover:border-white/15 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/12 before:to-transparent"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-ink">
                  {authorLabel(review)}
                </span>
                <StarRating value={review.rating} size={14} />
              </div>
              {date ? (
                <time
                  dateTime={review.created_at}
                  className="text-[12px] text-ink-faint"
                >
                  {date}
                </time>
              ) : null}
            </div>
            {review.body ? (
              <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {review.body}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
