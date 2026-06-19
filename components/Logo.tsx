import Link from "next/link";
import { cn } from "@/lib/cn";

// Pure-SVG mark: an abstract "L" / layer motif with a blue→cyan→violet gradient.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-xl bg-accent-cyan/30 blur-md"
      />
      <svg viewBox="0 0 32 32" className="h-8 w-8" role="img" aria-label="Leda logo">
        <defs>
          <linearGradient id="leda-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="0.5" stopColor="#2DD4BF" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#leda-mark)" opacity="0.16" />
        <path
          d="M11 8v12a2 2 0 0 0 2 2h8"
          fill="none"
          stroke="url(#leda-mark)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="21" cy="22" r="2.5" fill="#2DD4BF" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/70",
        className,
      )}
    >
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Leda
      </span>
    </Link>
  );
}
