"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
}

// Accessible tablist with full arrow-key navigation (Left/Right/Home/End),
// roving tabindex, and proper aria-controls wiring. The caller owns the active
// state and renders the matching panel(s) with the provided ids.
export function Tabs({
  tabs,
  active,
  onChange,
  className,
  "aria-label": ariaLabel = "Sections",
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  function focusTab(index: number) {
    const next = (index + tabs.length) % tabs.length;
    const el = refs.current[next];
    if (el) {
      el.focus();
      onChange(tabs[next].id);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTab(0);
        break;
      case "End":
        e.preventDefault();
        focusTab(tabs.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-surface p-1",
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={tabId(tab.id)}
            aria-selected={selected}
            aria-controls={panelId(tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
              selected
                ? "bg-white/[0.08] text-ink shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-white/[0.04]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// Helper so callers can wire panels with ids matching the tablist. Optional —
// callers may also build their own panel using the same id convention.
export function TabPanel({
  tabsId,
  id,
  active,
  children,
  className,
}: {
  tabsId: string;
  id: string;
  active: string;
  children: React.ReactNode;
  className?: string;
}) {
  const hidden = id !== active;
  return (
    <div
      role="tabpanel"
      id={`${tabsId}-panel-${id}`}
      aria-labelledby={`${tabsId}-tab-${id}`}
      hidden={hidden}
      tabIndex={0}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
        className,
      )}
    >
      {!hidden ? children : null}
    </div>
  );
}
