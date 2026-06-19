"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SearchBar } from "@/components/marketplace/ui/SearchBar";

// ---------------------------------------------------------------------------
// HomeSearch — thin client wrapper around the shared SearchBar for the
// marketplace home. Submitting (Enter / form submit) navigates to the
// workflows gallery with the query pre-filled, e.g. /marketplace/workflows?q=…
// An empty submit just opens the gallery.
// ---------------------------------------------------------------------------

export function HomeSearch({
  placeholder = "Search workflows and tools…",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(query: string) {
    const trimmed = query.trim();
    const href = trimmed
      ? `/marketplace/workflows?q=${encodeURIComponent(trimmed)}`
      : "/marketplace/workflows";
    router.push(href);
  }

  return (
    <div className="group relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px -z-10 rounded-xl bg-gradient-to-r from-accent-blue/20 via-accent-cyan/20 to-accent-violet/20 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100"
      />
      <SearchBar
        value={value}
        onChange={setValue}
        onSubmit={go}
        placeholder={placeholder}
        label="Search the marketplace"
      />
    </div>
  );
}
