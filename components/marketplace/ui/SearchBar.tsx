"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Controlled search input with a leading lucide Search icon, an accessible
// label, optional submit handling (Enter / form submit), and a clear button.
export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  onSubmit,
  label = "Search",
  className,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const id = useId();

  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className={cn(
          "h-11 w-full rounded-xl border border-white/[0.10] bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-accent-sky/50 focus-visible:ring-2 focus-visible:ring-accent-sky/40",
          // Hide the native search clear control; we render our own.
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-faint",
            "transition-colors hover:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
          )}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </form>
  );
}
