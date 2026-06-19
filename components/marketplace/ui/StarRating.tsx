"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// StarRating — read-only display. Renders 5 stars with fractional fill for the
// current value plus an optional review count. Purely presentational; safe to
// render inside a server component because it has no interactivity.
// ---------------------------------------------------------------------------

const MAX_STARS = 5;

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(MAX_STARS, value));
}

export function StarRating({
  value,
  count,
  size = 16,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const rating = clamp(value);
  const label =
    typeof count === "number"
      ? `Rated ${rating.toFixed(1)} out of 5 from ${count} ${
          count === 1 ? "review" : "reviews"
        }`
      : `Rated ${rating.toFixed(1)} out of 5`;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={label}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: MAX_STARS }).map((_, i) => {
          // Fraction of this star that should be filled (0..1).
          const fill = clamp(rating - i);
          const pct = Math.round(Math.max(0, Math.min(1, fill)) * 100);
          return (
            <span
              key={i}
              className="relative inline-block"
              style={{ width: size, height: size }}
            >
              <Star
                className="absolute inset-0 text-white/15"
                style={{ width: size, height: size }}
                strokeWidth={1.75}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${pct}%` }}
              >
                <Star
                  className="text-amber-400"
                  style={{ width: size, height: size }}
                  fill="currentColor"
                  strokeWidth={1.75}
                />
              </span>
            </span>
          );
        })}
      </span>
      <span className="text-xs font-medium tabular-nums text-ink-muted">
        {rating.toFixed(1)}
        {typeof count === "number" ? (
          <span className="ml-1 text-ink-faint">
            ({count.toLocaleString()})
          </span>
        ) : null}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// RatingInput — interactive 1..5 star picker. Keyboard accessible via a radio
// group (arrow keys move selection through native radios).
// ---------------------------------------------------------------------------

export function RatingInput({
  value,
  onChange,
  size = 24,
  className,
  name = "rating",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  name?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: MAX_STARS }).map((_, i) => {
        const star = i + 1;
        const filled = star <= active;
        const checked = star === value;
        return (
          <label
            key={star}
            className="cursor-pointer rounded-md p-0.5 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-sky/70"
            onMouseEnter={() => setHover(star)}
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={checked}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <Star
              className={cn(
                "transition-colors",
                filled ? "text-amber-400" : "text-white/20",
              )}
              style={{ width: size, height: size }}
              fill={filled ? "currentColor" : "none"}
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="sr-only">
              {star} {star === 1 ? "star" : "stars"}
            </span>
          </label>
        );
      })}
    </div>
  );
}
