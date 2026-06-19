"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, RotateCcw } from "lucide-react";

import { cn } from "@/lib/cn";
import { SearchBar } from "@/components/marketplace/ui/SearchBar";
import type { MarketplaceCategory } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// WorkflowFilters — client toolbar that reflects the current URL searchParams
// and updates them via next/navigation. It is a controlled mirror of the URL:
// the server page reads the same params and renders the filtered grid, so this
// component only writes to the URL (single source of truth) and never holds the
// authoritative filter state itself (apart from the in-progress search text).
//
// Controls: search, category, skill level, trigger, risk level, status,
// trust (official/verified/community), sort, plus a disabled "Paid · coming
// later" pricing control that is honest about payments being off.
// ---------------------------------------------------------------------------

/** The filter keys this toolbar manages in the URL. */
export interface WorkflowFilterParams {
  q?: string;
  category?: string;
  skill_level?: string;
  trigger?: string;
  risk_level?: string;
  status?: string;
  trust?: string;
  sort?: string;
}

const SKILL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const TRIGGER_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
] as const;

const RISK_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "coming_soon", label: "Coming soon" },
] as const;

const TRUST_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "verified", label: "Verified" },
  { value: "community", label: "Community" },
] as const;

const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "most_copied", label: "Most copied" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "editors_picks", label: "Editor's picks" },
] as const;

const fieldClass =
  "h-10 w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 text-sm text-ink transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:border-accent-cyan/50 focus-visible:ring-2 focus-visible:ring-accent-cyan/40";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint";

export function WorkflowFilters({
  params,
  categories,
}: {
  params: WorkflowFilterParams;
  categories: MarketplaceCategory[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Search text is the only locally-buffered value (so typing feels instant);
  // it is committed to the URL on submit. Everything else writes immediately.
  const [search, setSearch] = useState(params.q ?? "");

  const buildHref = useCallback(
    (next: WorkflowFilterParams): string => {
      const merged: WorkflowFilterParams = { ...params, ...next };
      const sp = new URLSearchParams();
      (Object.keys(merged) as (keyof WorkflowFilterParams)[]).forEach((key) => {
        const value = merged[key];
        if (typeof value === "string" && value.length > 0) {
          sp.set(key, value);
        }
      });
      const qs = sp.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [params, pathname],
  );

  const update = useCallback(
    (next: WorkflowFilterParams) => {
      startTransition(() => {
        router.replace(buildHref(next), { scroll: false });
      });
    },
    [buildHref, router],
  );

  const submitSearch = useCallback(
    (value: string) => {
      update({ q: value.trim() || undefined });
    },
    [update],
  );

  const hasActiveFilters = useMemo(() => {
    return (Object.keys(params) as (keyof WorkflowFilterParams)[]).some(
      (key) => key !== "sort" && (params[key]?.length ?? 0) > 0,
    );
  }, [params]);

  function clearAll() {
    setSearch("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <section
      aria-label="Filter and sort workflows"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 shadow-card backdrop-blur-[2px] sm:p-5",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent",
        pending && "opacity-90",
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Search row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            onSubmit={submitSearch}
            placeholder="Search workflows by name, tag, or description…"
            label="Search workflows"
            className="sm:max-w-md"
          />

          <div className="flex items-center gap-2 sm:ml-auto">
            <label htmlFor="wf-sort" className="text-[13px] text-ink-muted">
              Sort
            </label>
            <select
              id="wf-sort"
              value={params.sort ?? "trending"}
              onChange={(e) => update({ sort: e.target.value })}
              className={cn(fieldClass, "h-10 w-auto min-w-[10rem]")}
            >
              {SORT_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-surface-raised"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label htmlFor="wf-category" className={labelClass}>
              Category
            </label>
            <select
              id="wf-category"
              value={params.category ?? ""}
              onChange={(e) =>
                update({ category: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="" className="bg-surface-raised">
                All
              </option>
              {categories.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.slug}
                  className="bg-surface-raised"
                >
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wf-skill" className={labelClass}>
              Skill level
            </label>
            <select
              id="wf-skill"
              value={params.skill_level ?? ""}
              onChange={(e) =>
                update({ skill_level: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="" className="bg-surface-raised">
                Any
              </option>
              {SKILL_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-surface-raised"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wf-trigger" className={labelClass}>
              Trigger
            </label>
            <select
              id="wf-trigger"
              value={params.trigger ?? ""}
              onChange={(e) =>
                update({ trigger: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="" className="bg-surface-raised">
                Any
              </option>
              {TRIGGER_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-surface-raised"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wf-risk" className={labelClass}>
              Risk level
            </label>
            <select
              id="wf-risk"
              value={params.risk_level ?? ""}
              onChange={(e) =>
                update({ risk_level: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="" className="bg-surface-raised">
                Any
              </option>
              {RISK_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-surface-raised"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wf-status" className={labelClass}>
              Status
            </label>
            <select
              id="wf-status"
              value={params.status ?? ""}
              onChange={(e) =>
                update({ status: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="" className="bg-surface-raised">
                Any
              </option>
              {STATUS_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-surface-raised"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wf-trust" className={labelClass}>
              Source
            </label>
            <select
              id="wf-trust"
              value={params.trust ?? ""}
              onChange={(e) =>
                update({ trust: e.target.value || undefined })
              }
              className={fieldClass}
            >
              <option value="" className="bg-surface-raised">
                Any
              </option>
              {TRUST_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-surface-raised"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer row: disabled pricing control + reset */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 pt-3 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.10] before:to-transparent">
          <div className="flex items-center gap-2">
            <span className={cn(labelClass, "mb-0")}>Pricing</span>
            <span
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[12px] font-medium text-ink-faint"
              title="All workflows are free for now. Paid workflows are coming later."
              aria-disabled="true"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Free only · paid coming later
            </span>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-white/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/70"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset filters
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
