"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { primaryNav } from "@/lib/site";
import { cn } from "@/lib/cn";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-base/85 supports-[backdrop-filter]:bg-base/70">
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                isActive(item.href)
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <ButtonLink href="/contact" size="md">
            Join Waitlist
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-white/[0.06] bg-base md:hidden">
          <div className="mx-auto max-w-content space-y-1 px-5 py-4 sm:px-6">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-white/[0.06] text-ink"
                    : "text-ink-muted hover:bg-white/[0.04] hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
            <ButtonLink
              href="/contact"
              size="md"
              className="mt-2 w-full"
            >
              Join Waitlist
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
