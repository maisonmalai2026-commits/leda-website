"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, X } from "lucide-react";

import type { MarketplaceFlags } from "@/lib/marketplace/config";
import type { SessionUser } from "@/lib/marketplace/types";
import { AccountMenu } from "@/components/marketplace/AccountMenu";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface NavLink {
  href: string;
  label: string;
  /** When true, only match the exact path (so /marketplace isn't "active" everywhere). */
  exact?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/marketplace", label: "Browse", exact: true },
  { href: "/marketplace/workflows", label: "Workflows" },
  { href: "/marketplace/plugins", label: "Plugins" },
  { href: "/marketplace/creators", label: "Creators" },
];

export function MarketplaceSubnav({
  sessionUser,
  flags,
}: {
  sessionUser: SessionUser | null;
  flags: MarketplaceFlags;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (link: NavLink) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  return (
    <nav
      aria-label="Marketplace"
      className="sticky top-16 z-30 border-b border-white/[0.06] bg-base/85 backdrop-blur supports-[backdrop-filter]:bg-base/70"
    >
      <div className="mx-auto flex h-14 max-w-content items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                isActive(link)
                  ? "bg-white/[0.06] text-ink"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 md:hidden"
          aria-label={open ? "Close marketplace menu" : "Open marketplace menu"}
          aria-expanded={open}
          aria-controls="marketplace-mobile-nav"
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <ButtonLink
            href="/creator/dashboard"
            variant="secondary"
            size="md"
            className="hidden h-9 px-3 text-[13px] sm:inline-flex"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Become a creator
          </ButtonLink>
          <AccountMenu sessionUser={sessionUser} flags={flags} />
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div
          id="marketplace-mobile-nav"
          className="border-t border-white/[0.06] bg-base md:hidden"
        >
          <div className="mx-auto max-w-content space-y-1 px-5 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(link) ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(link)
                    ? "bg-white/[0.06] text-ink"
                    : "text-ink-muted hover:bg-white/[0.04] hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
            <ButtonLink
              href="/creator/dashboard"
              variant="secondary"
              size="md"
              className="mt-2 w-full"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Become a creator
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
