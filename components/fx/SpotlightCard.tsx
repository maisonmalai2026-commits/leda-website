"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * SpotlightCard — a container that reveals a soft radial glow following the
 * cursor on hover. Wrap any card to give it a premium interactive feel.
 */
export function SpotlightCard({
  children,
  className,
  glow = "rgba(56,189,248,0.16)",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn("group relative overflow-hidden", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(380px circle at var(--spot-x, 50%) var(--spot-y, 0%), ${glow}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
