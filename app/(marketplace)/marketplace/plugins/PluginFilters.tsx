"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/cn";
import { SearchBar } from "@/components/marketplace/ui/SearchBar";
import type { PluginSort, TrustStatus } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// PluginFilters — co-located client control surface for the plugin gallery.
//
// It owns no data; it only reads/writes the URL searchParams that the server
// page consumes (q, category, trust_status, sort). Navigation is done with
// router.replace so the back button isn't flooded and the server re-renders the
// filtered grid. The search box is debounce-free but submits on Enter / clear.
// ---------------------------------------------------------------------------

interface CategoryOption {
  /** The slug written to the URL (?category=). */
  slug: string;
  label: string;
}

// Category tabs requested for the plugin gallery. "Coming Soon" maps to the
// coming_soon trust tier rather than a category slug, so it is handled as a
// trust filter shortcut (see isComingSoonTab).
const CATEGORY_TABS: CategoryOption[] = [
  { slug: "productivity", label: "Productivity" },
  { slug: "communication", label: "Communication" },
  { slug: "education", label: "Education" },
  { slug: "writing", label: "Writing" },
  { slug: "files", label: "Files" },
  { slug: "calendar", label: "Calendar" },
  { slug: "browser", label: "Browser" },
  { slug: "ai-brains", label: "AI Brains" },
  { slug: "images", label: "Images" },
  { slug: "developer-tools", label: "Developer Tools" },
  { slug: "experimental", label: "Experimental" },
];

const TRUST_OPTIONS: { value: TrustStatus; label: string }[] = [
  { value: "official", label: "Official" },
  { value: "verified", label: "Verified" },
  { value: "community", label: "Community" },
  { value: "experimental", label: "Experimental" },
  { value: "coming_soon", label: "Coming soon" },
];

const SORT_OPTIONS: { value: PluginSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "editors_picks", label: "Editor's picks" },
];

const tab =
  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70";
const tabActive = "bg-white/[0.08] text-ink shadow-sm";
const tabIdle = "text-ink-muted hover:bg-white/[0.04] hover:text-ink";

export function PluginFilters({
  q,
  category,
  trustStatus,
  sort,
}: {
  q?: string;
  category?: string;
  trustStatus?: string;
  sort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q ?? "");

  const activeSort: PluginSort = useMemo(() => {
    const found = SORT_OPTIONS.find((s) => s.value === sort);
    return found ? found.value : "trending";
  }, [sort]);

  // Build a new query string off the current params, overriding/removing keys.
  const buildHref = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      return qs ? `/marketplace/plugins?${qs}` : "/marketplace/plugins";
    },
    [searchParams],
  );

  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const href = buildHref(updates);
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [buildHref, router],
  );

  function submitQuery(value: string) {
    navigate({ q: value.trim() || undefined });
  }

  // A category tab is "active" when its slug matches ?category. The category
  // controls and the trust filter are independent.
  const activeCategory = category ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={submitQuery}
          placeholder="Search plugins by name, app, or tag…"
          label="Search plugins"
          className="sm:max-w-md"
        />

        <div className="flex items-center gap-2 sm:ml-auto">
          <label
            htmlFor="plugin-sort"
            className="text-[13px] font-medium text-ink-muted"
          >
            Sort
          </label>
          <select
            id="plugin-sort"
            value={activeSort}
            onChange={(e) => navigate({ sort: e.target.value })}
            disabled={pending}
            className="h-10 rounded-xl border border-white/12 bg-surface px-3 text-sm text-ink focus:border-accent-sky/40 focus:outline-none focus:ring-2 focus:ring-accent-sky/40 disabled:opacity-60"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface-raised">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div>
        <span className="sr-only" id="plugin-category-label">
          Filter by category
        </span>
        <div
          role="group"
          aria-labelledby="plugin-category-label"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => navigate({ category: undefined })}
            aria-pressed={activeCategory === ""}
            className={cn(tab, activeCategory === "" ? tabActive : tabIdle)}
          >
            All
          </button>
          {CATEGORY_TABS.map((c) => {
            const isActive = activeCategory === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() =>
                  navigate({ category: isActive ? undefined : c.slug })
                }
                aria-pressed={isActive}
                className={cn(tab, isActive ? tabActive : tabIdle)}
              >
                {c.label}
              </button>
            );
          })}
          {/* "Coming Soon" is a trust-tier shortcut, not a category. */}
          <button
            type="button"
            onClick={() =>
              navigate({
                trust_status:
                  trustStatus === "coming_soon" ? undefined : "coming_soon",
                category: undefined,
              })
            }
            aria-pressed={trustStatus === "coming_soon"}
            className={cn(
              tab,
              trustStatus === "coming_soon" ? tabActive : tabIdle,
            )}
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Trust filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          Trust
        </span>
        <div
          role="group"
          aria-label="Filter by trust status"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => navigate({ trust_status: undefined })}
            aria-pressed={!trustStatus}
            className={cn(
              "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
              !trustStatus
                ? "border-accent-sky/30 bg-accent-sky/10 text-accent-sky"
                : "border-white/12 bg-white/[0.04] text-ink-muted hover:border-white/20 hover:text-ink",
            )}
          >
            Any
          </button>
          {TRUST_OPTIONS.map((t) => {
            const isActive = trustStatus === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  navigate({ trust_status: isActive ? undefined : t.value })
                }
                aria-pressed={isActive}
                className={cn(
                  "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                  isActive
                    ? "border-accent-sky/30 bg-accent-sky/10 text-accent-sky"
                    : "border-white/12 bg-white/[0.04] text-ink-muted hover:border-white/20 hover:text-ink",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
