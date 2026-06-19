import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  ShieldCheck,
  Workflow as WorkflowIcon,
  Plug,
  Users,
  FolderTree,
  Flag,
  Star,
  BadgeCheck,
  Archive,
  ScrollText,
  Settings2,
  Hourglass,
  ArrowRight,
  Lock,
  Info,
  type LucideIcon,
} from "lucide-react";

import { requireRole } from "@/lib/marketplace/auth";
import { getMarketplaceFlags, PLATFORM_FEE_BPS } from "@/lib/marketplace/config";
import {
  listCategories,
  listCreators,
  listPlugins,
  listWorkflows,
} from "@/lib/marketplace/data";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { DemoBadge } from "@/components/marketplace/ui/TrustBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Admin dashboard · Leda Marketplace",
  description:
    "Protected admin overview: marketplace metrics, pending submissions, moderation, and feature flags.",
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------------
// Small presentational helpers (server components).
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  Icon,
  hint,
}: {
  label: string;
  value: number | string;
  Icon: LucideIcon;
  hint?: string;
}) {
  return (
    <SpotlightCard className="h-full rounded-2xl">
      <Card interactive className="flex h-full items-start gap-3.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          <p className="text-[13px] text-ink-muted">{label}</p>
          {hint ? (
            <p className="mt-0.5 text-[12px] text-ink-faint">{hint}</p>
          ) : null}
        </div>
      </Card>
    </SpotlightCard>
  );
}

function PlaceholderSection({
  title,
  description,
  Icon,
  children,
  cta,
}: {
  title: string;
  description: string;
  Icon: LucideIcon;
  children?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-muted">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="font-display text-base font-semibold text-ink">
            {title}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-faint">
          <Lock className="h-3 w-3" aria-hidden />
          Placeholder
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {children}
      {cta ? <div className="pt-1">{cta}</div> : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminPage() {
  const admin = await requireRole("admin");
  const flags = getMarketplaceFlags();

  // Accessible gate — never redirect, never crash.
  if (!admin) {
    return (
      <Reveal className="mx-auto max-w-xl">
        <div className="grain relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.015]">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle,rgba(139,92,246,0.4),transparent 70%)",
            }}
          />
          <EmptyState
            className="border-transparent bg-transparent"
            icon={Lock}
            title="Admin access required"
            description={
              flags.demoMode
                ? "This is the protected admin dashboard. Switch your Demo identity to “Admin” using the account menu above to explore it."
                : "You need an admin role to view this dashboard. Ask an existing admin for access."
            }
            action={
              <ButtonLink href="/marketplace" variant="secondary">
                Back to marketplace
              </ButtonLink>
            }
          />
        </div>
      </Reveal>
    );
  }

  // Metrics come ONLY from the data layer — no fabricated numbers.
  const [workflows, plugins, creators, categories] = await Promise.all([
    listWorkflows(),
    listPlugins(),
    listCreators(),
    listCategories(),
  ]);

  const verifiedCreators = creators.filter((c) => c.is_verified_creator).length;
  const feePct = (PLATFORM_FEE_BPS / 100).toFixed(0);

  return (
    <div className="space-y-10">
      {/* Header */}
      <Reveal as="header" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-teal/30 bg-gradient-to-br from-accent-teal/20 to-accent-violet/15 text-accent-teal shadow-glow-teal">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Admin dashboard
            </h1>
            <p className="text-sm text-ink-muted">
              Signed in as{" "}
              <span className="text-ink">{admin.profile.display_name}</span> ·{" "}
              {admin.role}
            </p>
          </div>
        </div>

        {flags.demoMode ? (
          <div
            role="note"
            className="relative flex items-start gap-2.5 overflow-hidden rounded-2xl border border-accent-sky/25 bg-accent-sky/[0.06] px-4 py-3.5 text-[13px] leading-relaxed text-ink-muted shadow-glow-blue"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-accent-sky/15 blur-3xl"
            />
            <Info
              className="relative mt-0.5 h-4 w-4 shrink-0 text-accent-sky"
              aria-hidden
            />
            <p className="relative">
              <span className="font-semibold text-ink">Demo mode.</span> All
              numbers below are computed from seed content only — nothing is
              fabricated. Management controls are honest placeholders until a
              backend is connected.
            </p>
          </div>
        ) : null}
      </Reveal>

      {/* Marketplace metrics */}
      <section className="space-y-4">
        <Reveal>
          <SectionHeading
            eyebrow="Overview"
            title="Marketplace metrics"
            description="Counts of publicly-visible content, sourced from the data layer."
          />
        </Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem className="h-full">
            <MetricCard
              label="Public workflows"
              value={workflows.length}
              Icon={WorkflowIcon}
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <MetricCard
              label="Public plugin listings"
              value={plugins.length}
              Icon={Plug}
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <MetricCard
              label="Public creators"
              value={creators.length}
              Icon={Users}
              hint={`${verifiedCreators} verified`}
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <MetricCard
              label="Active categories"
              value={categories.length}
              Icon={FolderTree}
            />
          </StaggerItem>
        </Stagger>
      </section>

      {/* Pending submissions + quick links */}
      <Reveal as="section" className="grid gap-5 lg:grid-cols-2">
        <Card interactive className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
              <Hourglass className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">
              Pending submissions
            </h3>
            {flags.demoMode ? <DemoBadge /> : null}
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            New workflow drafts and plugin listings land in the moderation queue
            with status <span className="font-mono text-ink-faint">pending</span>{" "}
            and stay there until a human moderator approves them. In demo mode
            there is no real submissions table, so the queue is synthesized from
            seed content and clearly labeled.
          </p>
          <Link
            href="/moderation"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium text-accent-sky",
              "hover:text-accent-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded",
            )}
          >
            Open the moderation queue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>

        <PlaceholderSection
          title="Reports overview"
          description="Aggregated user reports (spam, unsafe permissions, IP issues) with triage status. Reports are not publicly visible; in demo mode there is no reports backend, so this panel is intentionally empty."
          Icon={Flag}
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[13px] text-ink-faint">
            0 open reports · 0 reviewing · 0 resolved
          </div>
        </PlaceholderSection>
      </Reveal>

      {/* Management placeholders */}
      <section className="space-y-4">
        <Reveal>
          <SectionHeading
            eyebrow="Management"
            title="Admin controls"
            description="Honest placeholders. These wire up to the database once a backend is connected — nothing here fabricates state."
          />
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-2">
          <PlaceholderSection
            title="Featured listings"
            description="Pin editor's-pick workflows and plugins to discovery surfaces. Selection is curated by admins, never auto-promoted."
            Icon={Star}
            cta={
              <Link
                href="/marketplace/workflows"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-sky hover:text-accent-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70 rounded"
              >
                Browse candidates
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />

          <PlaceholderSection
            title="Creator verification"
            description="Grant or revoke the verified-creator badge after manual review of identity and track record. No badge is ever granted automatically."
            Icon={BadgeCheck}
          >
            <p className="text-[13px] text-ink-muted">
              {verifiedCreators} of {creators.length} creators currently verified
              (from seed).
            </p>
          </PlaceholderSection>

          <PlaceholderSection
            title="Suspend / deprecate content"
            description="Take published workflows or plugins offline, or mark them deprecated. Every action is logged and reversible by an admin."
            Icon={Archive}
          />

          <PlaceholderSection
            title="Audit log viewer"
            description="Chronological record of every moderation and admin action with actor, target, and reason."
            Icon={ScrollText}
          >
            <p className="text-[12px] leading-relaxed text-ink-faint">
              In demo mode, audit entries are appended to{" "}
              <span className="font-mono text-ink-muted">
                data/marketplace/audit.log
              </span>{" "}
              by the server actions. A searchable viewer arrives with the
              backend.
            </p>
          </PlaceholderSection>
        </div>
      </section>

      {/* Category management */}
      <section className="space-y-4">
        <Reveal>
          <SectionHeading
            eyebrow="Taxonomy"
            title="Category management"
            description="Categories drive marketplace filtering. Editing is a placeholder; the current list is shown for reference."
          />
        </Reveal>
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-muted">
                <FolderTree className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="font-display text-base font-semibold text-ink">
                Active categories
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-faint">
              <Lock className="h-3 w-3" aria-hidden />
              Read-only
            </span>
          </div>
          {categories.length === 0 ? (
            <p className="text-[13px] text-ink-faint">No active categories.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.035]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {cat.name}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-ink-faint">
                      {cat.slug}
                    </span>
                  </span>
                  <Pill className="shrink-0 capitalize">{cat.type}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Feature flags */}
      <section className="space-y-4">
        <Reveal>
          <SectionHeading
            eyebrow="Configuration"
            title="Feature flags"
            description="Resolved server-side from environment. Read-only here — change these via env and redeploy."
          />
        </Reveal>
        <Card className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-ink-muted">
              <Settings2 className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">
              Marketplace flags
            </h3>
          </div>
          <dl className="divide-y divide-white/[0.06]">
            <FlagRow
              label="Demo mode"
              value={flags.demoMode}
              onText="On — running against seed data (no Supabase)"
              offText="Off — connected to Supabase"
            />
            <FlagRow
              label="Payments enabled"
              value={flags.paymentsEnabled}
              onText="On — Stripe checkout active"
              offText="Off — all content free, checkout shows “coming later”"
            />
          </dl>
          <p className="text-[12px] leading-relaxed text-ink-faint">
            Platform fee (shown to creators before publishing):{" "}
            <span className="text-ink-muted">{feePct}%</span>.
          </p>
        </Card>
      </section>

      {/* Footer link back to moderation */}
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/moderation" variant="secondary">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Go to moderation queue
        </ButtonLink>
        <ButtonLink href="/marketplace" variant="ghost">
          Back to marketplace
        </ButtonLink>
      </div>
    </div>
  );
}

function FlagRow({
  label,
  value,
  onText,
  offText,
}: {
  label: string;
  value: boolean;
  onText: string;
  offText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="text-sm font-medium text-ink">{label}</dt>
        <dd className="text-[12px] leading-relaxed text-ink-muted">
          {value ? onText : offText}
        </dd>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          value
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            : "border-white/12 bg-white/[0.04] text-ink-muted",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            value ? "bg-emerald-400" : "bg-ink-faint",
          )}
          aria-hidden
        />
        {value ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}
