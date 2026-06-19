import Link from "next/link";
import { BadgeCheck, ArrowUpRight, Workflow, Puzzle, Heart } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// CreatorCard — server component. Presentational only. Shows avatar initials,
// display_name, @handle, a verified badge when applicable, public counts, and
// links to the creator profile route /u/[handle].
// ---------------------------------------------------------------------------

function initials(name: string, handle: string): string {
  const source = (name || handle || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatCount(n: number | undefined): string {
  return Number.isFinite(n) ? (n as number).toLocaleString() : "0";
}

export function CreatorCard({ creator }: { creator: Profile }) {
  const href = `/u/${creator.handle}`;
  const verified = creator.is_verified_creator;

  return (
    <Card
      interactive
      className="group relative flex h-full flex-col gap-4 p-5"
    >
      <div className="flex items-center gap-3.5">
        {/* Avatar */}
        <span
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-gradient-to-br from-accent-blue/25 to-accent-teal/20 text-sm font-semibold text-ink"
          aria-hidden
        >
          {initials(creator.display_name, creator.handle)}
        </span>

        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-base font-semibold leading-tight text-ink">
            <Link
              href={href}
              className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-accent-sky/70"
            >
              {creator.display_name}
            </Link>
            {verified ? (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-accent-sky"
                aria-label="Verified creator"
              />
            ) : null}
          </h3>
          <p className="truncate text-[13px] text-ink-muted">@{creator.handle}</p>
        </div>
      </div>

      {creator.bio ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {creator.bio}
        </p>
      ) : null}

      {/* Public counts */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-4 text-[12px] text-ink-faint">
          <span className="inline-flex items-center gap-1" title="Public workflows">
            <Workflow className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">
              {formatCount(creator.public_workflow_count)}
            </span>
            <span className="sr-only">public workflows</span>
          </span>
          <span className="inline-flex items-center gap-1" title="Public plugins">
            <Puzzle className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">
              {formatCount(creator.public_plugin_count)}
            </span>
            <span className="sr-only">public plugins</span>
          </span>
          <span className="inline-flex items-center gap-1" title="Total likes">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{formatCount(creator.total_likes)}</span>
            <span className="sr-only">total likes</span>
          </span>
        </div>
        <span
          className={cn(
            "relative z-10 inline-flex items-center gap-1 text-[13px] font-medium text-accent-sky",
            "transition-transform group-hover:translate-x-0.5",
          )}
          aria-hidden
        >
          View profile
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
