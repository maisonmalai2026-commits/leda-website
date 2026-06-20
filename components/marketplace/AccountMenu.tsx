"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Info,
  Loader2,
  LogOut,
  UserRound,
} from "lucide-react";

import type { MarketplaceFlags } from "@/lib/marketplace/config";
import type { Role, SessionUser, UserRole } from "@/lib/marketplace/types";
import { signOut } from "@/lib/marketplace/auth-actions";
import { useToast } from "@/components/marketplace/ui/Toast";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface RoleOption {
  value: Role;
  label: string;
  hint: string;
}

// Guest + the four real user roles. "guest" clears the demo cookie.
const ROLE_OPTIONS: RoleOption[] = [
  { value: "guest", label: "Guest", hint: "Signed out" },
  { value: "user", label: "User", hint: "Browse, like, copy, review" },
  { value: "creator", label: "Creator", hint: "Publish workflows & plugins" },
  { value: "moderator", label: "Moderator", hint: "Review submissions" },
  { value: "admin", label: "Admin", hint: "Full marketplace access" },
];

const ROLE_LABELS: Record<Role, string> = {
  guest: "Guest",
  user: "User",
  creator: "Creator",
  moderator: "Moderator",
  admin: "Admin",
};

export function AccountMenu({
  sessionUser,
  flags,
}: {
  sessionUser: SessionUser | null;
  flags: MarketplaceFlags;
}) {
  // DEMO MODE — unchanged behavior: the local demo-role switcher. When Supabase
  // is configured (flags.demoMode === false) we switch to real-auth UI below.
  if (flags.demoMode) {
    return <DemoRoleSwitcher sessionUser={sessionUser} />;
  }

  // REAL AUTH — no signed-in user: offer log in / sign up.
  if (!sessionUser) {
    return (
      <div className="flex items-center gap-2">
        <ButtonLink href="/login" variant="ghost" size="md" className="h-9 px-3">
          Log in
        </ButtonLink>
        <ButtonLink href="/signup" variant="primary" size="md" className="h-9 px-3.5">
          Sign up
        </ButtonLink>
      </div>
    );
  }

  // REAL AUTH — signed in: account dropdown.
  return <RealAccountMenu sessionUser={sessionUser} />;
}

// ---------------------------------------------------------------------------
// Demo role switcher (PRESERVED — original behavior, unchanged).
// ---------------------------------------------------------------------------

function DemoRoleSwitcher({ sessionUser }: { sessionUser: SessionUser | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Role | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const currentRole: Role = sessionUser?.role ?? "guest";
  const displayName = sessionUser?.profile.display_name ?? "Guest";
  const handle = sessionUser?.profile.handle ?? null;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Close on Escape and return focus to the trigger.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const switchRole = useCallback(
    async (role: Role) => {
      if (role === currentRole || pending) {
        setOpen(false);
        return;
      }
      setPending(role);
      try {
        const res =
          role === "guest"
            ? await fetch("/api/marketplace/auth/demo", { method: "DELETE" })
            : await fetch("/api/marketplace/auth/demo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
              });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        toast({
          variant: "success",
          title:
            role === "guest"
              ? "Signed out of demo session"
              : `Demo identity: ${ROLE_LABELS[role]}`,
          description: "Local demo only — replaced by real sign-in later.",
        });
        setOpen(false);
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Could not switch demo identity",
          description: "Please try again.",
        });
      } finally {
        setPending(null);
      }
    },
    [currentRole, pending, router, toast],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-left text-sm transition-all",
          "hover:bg-white/[0.08] hover:border-accent-cyan/30 hover:shadow-[0_0_22px_-10px_rgba(56,189,248,0.7)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        )}
      >
        <span
          aria-hidden
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue via-accent-cyan to-accent-teal text-[11px] font-semibold text-base shadow-[0_0_14px_-4px_rgba(34,211,238,0.6)]"
        >
          {sessionUser ? (
            initials(displayName)
          ) : (
            <UserRound className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-[13px] font-medium text-ink">
            {displayName}
          </span>
          <span className="truncate text-[11px] text-ink-faint">
            {handle ? `@${handle}` : "Not signed in"}
          </span>
        </span>
        <span className="hidden rounded-md border border-accent-cyan/20 bg-accent-cyan/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-cyan md:inline">
          {ROLE_LABELS[currentRole]}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-faint transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Demo identity"
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-white/[0.10] bg-surface-raised/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-up before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
        >
          <div className="flex items-start gap-2 px-2.5 pb-2 pt-2">
            <Info
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-sky"
              aria-hidden
            />
            <p
              className="text-[11px] leading-relaxed text-ink-muted"
              id={`${menuId}-desc`}
            >
              <span className="font-medium text-ink-muted">Demo identity</span> —
              local only. Switching role lets you explore gated pages. Replaced by
              real sign-in once Supabase is configured.
            </p>
          </div>

          <div
            role="group"
            aria-describedby={`${menuId}-desc`}
            className="border-t border-white/[0.06] pt-1"
          >
            {ROLE_OPTIONS.map((option) => {
              const active = option.value === currentRole;
              const isPending = pending === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  disabled={pending !== null}
                  onClick={() => switchRole(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    active
                      ? "border border-accent-teal/20 bg-gradient-to-r from-accent-teal/[0.10] to-transparent text-ink"
                      : "border border-transparent text-ink-muted hover:bg-white/[0.05] hover:text-ink",
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : active ? (
                      <Check className="h-4 w-4 text-accent-teal" aria-hidden />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-ink-faint">
                      {option.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Real-auth account dropdown (Supabase mode, signed in).
// ---------------------------------------------------------------------------

function RealAccountMenu({ sessionUser }: { sessionUser: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const displayName = sessionUser.profile.display_name;
  const handle = sessionUser.profile.handle;
  const role: Role = sessionUser.role;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Close on Escape and return focus to the trigger.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setOpen(false);
      router.push("/");
      router.refresh();
      setSigningOut(false);
    }
  }, [router, signingOut]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-left text-sm transition-all",
          "hover:bg-white/[0.08] hover:border-accent-cyan/30 hover:shadow-[0_0_22px_-10px_rgba(56,189,248,0.7)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        )}
      >
        <span
          aria-hidden
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue via-accent-cyan to-accent-teal text-[11px] font-semibold text-base shadow-[0_0_14px_-4px_rgba(34,211,238,0.6)]"
        >
          {initials(displayName)}
        </span>
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-[13px] font-medium text-ink">
            {displayName}
          </span>
          <span className="truncate text-[11px] text-ink-faint">
            @{handle}
          </span>
        </span>
        <span className="hidden rounded-md border border-accent-cyan/20 bg-accent-cyan/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-cyan md:inline">
          {ROLE_LABELS[role]}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-faint transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-white/[0.10] bg-surface-raised/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-up before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
        >
          <div className="px-2.5 pb-2 pt-2">
            <p className="truncate text-[13px] font-medium text-ink">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-ink-faint">@{handle}</p>
          </div>

          <div className="border-t border-white/[0.06] pt-1">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-muted transition-colors",
                "hover:bg-white/[0.05] hover:text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
              )}
            >
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              Account
            </Link>
            <Link
              href={`/u/${handle}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-muted transition-colors",
                "hover:bg-white/[0.05] hover:text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
              )}
            >
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              Public profile
            </Link>

            <div className="mt-1 border-t border-white/[0.06] pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-muted transition-colors",
                  "hover:bg-white/[0.05] hover:text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                )}
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Up to two uppercase initials from a display name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
