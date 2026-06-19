"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import type { Plugin } from "@/lib/content";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PluginTypeBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const filters = ["All", "Productivity", "Communication", "Education", "Calendar", "Writing", "AI Brains", "Coming Soon"];

export function PluginsExplorer({ plugins }: { plugins: Plugin[] }) {
  const [filter, setFilter] = useState("All");

  const visible = useMemo(() => {
    if (filter === "All") return plugins;
    if (filter === "Coming Soon")
      return plugins.filter((p) => p.status === "coming-soon");
    return plugins.filter((p) => p.category === filter);
  }, [filter, plugins]);

  return (
    <div>
      {/* category filter */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Plugin categories">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
              filter === f
                ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal"
                : "border-white/[0.08] bg-base/40 text-ink-muted hover:text-ink",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <PluginCard key={p.slug} plugin={p} />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-muted">
          No plugins in this category yet — more are on the way.
        </p>
      ) : null}
    </div>
  );
}

function PluginCard({ plugin }: { plugin: Plugin }) {
  const [open, setOpen] = useState(false);

  return (
    <Card interactive className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <PluginTypeBadge badge={plugin.badge} />
        <StatusBadge status={plugin.status} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-ink">{plugin.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {plugin.description}
      </p>

      {/* permission summary */}
      <div className="mt-4 rounded-xl border border-white/[0.07] bg-base/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
          <ShieldCheck size={13} className="text-accent-teal" />
          Requested permissions
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">{plugin.permissions[0]}</p>

        {open ? (
          <ul className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
            {plugin.permissions.slice(1).map((perm) => (
              <li key={perm} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-teal/70" />
                {perm}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-1 self-start rounded-lg px-1 py-1 text-sm font-medium text-accent-teal transition-colors hover:text-accent-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
        aria-expanded={open}
      >
        {open ? "Show less" : "Learn more"}
        <ChevronDown
          size={15}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
    </Card>
  );
}
