import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";

import { Section } from "@/components/ui/Section";
import { Card, SectionHeading } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/fx/motion";
import { ProfileForm } from "@/components/account/ProfileForm";
import { SignOutButton } from "@/components/account/SignOutButton";
import { getSessionUser } from "@/lib/marketplace/auth";
import { isDemoMode } from "@/lib/marketplace/config";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your Leda profile, handle, and account settings.",
  robots: { index: false, follow: false },
};

const ROLE_LABELS: Record<string, string> = {
  user: "User",
  creator: "Creator",
  moderator: "Moderator",
  admin: "Admin",
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const demoMode = isDemoMode();
  const { profile } = user;
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your account"
        description="Manage how you appear across the Leda marketplace — your display name, handle, bio, and links."
      />

      <Section className="pt-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {demoMode ? (
            <Reveal>
              <div
                role="note"
                className="flex items-start gap-2.5 rounded-2xl border border-accent-sky/20 bg-accent-sky/[0.06] px-4 py-3 text-[13px] leading-relaxed text-ink-muted"
              >
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky"
                  aria-hidden
                />
                <span>
                  This is a{" "}
                  <span className="font-medium text-ink">demo identity</span> —
                  local only. Connect Supabase to enable real accounts and save
                  your profile.
                </span>
              </div>
            </Reveal>
          ) : null}

          {/* Profile header card */}
          <Reveal>
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <ProfileAvatar name={profile.display_name} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-2xl font-semibold tracking-tight text-ink">
                      {profile.display_name}
                    </h2>
                    {profile.is_verified_creator ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-accent-cyan/25 bg-accent-cyan/[0.08] px-2 py-0.5 text-[11px] font-medium text-accent-cyan"
                        title="Verified creator"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 truncate text-sm text-ink-muted">
                    @{profile.handle}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-accent-violet/20 bg-accent-violet/[0.07] px-2 py-1 font-medium text-accent-violet">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      {roleLabel}
                    </span>
                    {user.email ? (
                      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-ink-muted">
                        {user.email}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-ink-faint">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      Joined {formatJoined(profile.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-5">
                <Link
                  href={`/u/${profile.handle}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-sm text-ink transition-colors",
                    "hover:border-accent-cyan/30 hover:bg-white/[0.08]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  )}
                >
                  View public profile
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <SignOutButton />
              </div>
            </Card>
          </Reveal>

          {/* Edit form */}
          <Reveal>
            <Card>
              <SectionHeading
                title="Edit profile"
                description="Update your public details. Changes appear on your profile across the marketplace."
              />
              <div className="mt-6">
                <ProfileForm profile={profile} demoMode={demoMode} />
              </div>
            </Card>
          </Reveal>
        </div>
      </Section>
    </>
  );
}

/** Big avatar showing display-name initials inside a glowing ring. */
function ProfileAvatar({ name }: { name: string }) {
  return (
    <div className="relative shrink-0">
      <div
        aria-hidden
        className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent-blue via-accent-cyan to-accent-violet opacity-60 blur-md"
      />
      <div
        aria-hidden
        className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-accent-blue via-accent-cyan to-accent-teal text-2xl font-semibold text-base shadow-[0_0_30px_-6px_rgba(34,211,238,0.7)]"
      >
        {initials(name)}
      </div>
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

/** Formats an ISO timestamp as a short "Month Year" label. */
function formatJoined(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
