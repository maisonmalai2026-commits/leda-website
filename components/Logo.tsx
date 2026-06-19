import Link from "next/link";
import { cn } from "@/lib/cn";

// Pure-SVG mark: two overlapping rounded shapes forming an abstract "L" / layer
// motif with a blue→teal gradient. No external asset required.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="Leda logo"
    >
      <defs>
        <linearGradient id="leda-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#leda-mark)" opacity="0.18" />
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
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
        className,
      )}
    >
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-ink">Leda</span>
    </Link>
  );
}
