"use client";

import { useId, useState, useTransition } from "react";
import {
  CircleAlert,
  FileText,
  Loader2,
  Plug,
  Send,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { submitPluginListing } from "@/lib/marketplace/actions";
import type {
  MarketplaceCategory,
  ValidationIssue,
  ValidationResult,
} from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// PluginForm — client form for plugin LISTING METADATA ONLY.
//
// There are no file/code upload fields anywhere. Installation model is limited
// to the two metadata-only options the validator allows (listing_only,
// native_builtin). A required confirmation checkbox must be ticked, and the
// server action (submitPluginListing) re-checks the creator role and re-runs
// validatePluginListing with { confirmed }.
// ---------------------------------------------------------------------------

const GUEST_TOAST = "Sign in (demo) to do that";

const CONFIRM_TEXT =
  "I confirm this listing does not request passwords, browser cookies, private API keys, executable uploads, or hidden data collection.";

// Only the two metadata-only models the submission validator accepts.
const INSTALL_OPTIONS: {
  value: "listing_only" | "native_builtin";
  label: string;
  hint: string;
}[] = [
  {
    value: "listing_only",
    label: "Listing only",
    hint: "Metadata in the marketplace. Nothing is installed automatically.",
  },
  {
    value: "native_builtin",
    label: "Native built-in",
    hint: "Ships inside Leda itself once reviewed and built in by the team.",
  },
];

const inputClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-shadow duration-200 focus:border-accent-sky/50 focus:outline-none focus:ring-2 focus:ring-accent-sky/40 focus:shadow-glow-blue";

function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return (
    <ul role="list" className="flex flex-col gap-2">
      {[...errors, ...warnings].map((issue, i) => {
        const isError = issue.severity === "error";
        return (
          <li
            key={`${issue.code}-${issue.path ?? i}`}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] leading-relaxed",
              isError
                ? "border-rose-400/25 bg-rose-400/[0.07] text-rose-200"
                : "border-amber-400/25 bg-amber-400/[0.07] text-amber-200",
            )}
          >
            {isError ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <span className="min-w-0">
              <span className="font-medium">{issue.message}</span>
              {issue.path ? (
                <span className="ml-1 break-all font-mono text-[11px] text-ink-faint">
                  ({issue.path})
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function PluginForm({
  categories,
}: {
  categories: Pick<MarketplaceCategory, "id" | "name">[];
}) {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [pending, startTransition] = useTransition();
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [supportedApps, setSupportedApps] = useState("");
  const [permissions, setPermissions] = useState("");
  const [installModel, setInstallModel] = useState<
    "listing_only" | "native_builtin"
  >("listing_only");
  const [sourceUrl, setSourceUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [screenshots, setScreenshots] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const nameId = useId();
  const shortId = useId();
  const longId = useId();
  const categoryFieldId = useId();
  const appsId = useId();
  const permsId = useId();
  const sourceId = useId();
  const docsId = useId();
  const versionId = useId();
  const changelogId = useId();
  const screenshotsId = useId();
  const emailId = useId();
  const confirmId = useId();

  function csvToArray(value: string): string[] {
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }
    if (!confirmed) {
      toast({
        title: "Confirmation required",
        description: "Please tick the safety confirmation before submitting.",
        variant: "info",
      });
      return;
    }

    startTransition(async () => {
      const res = await submitPluginListing({
        name: name.trim(),
        short_description: shortDescription.trim(),
        long_description: longDescription.trim(),
        category_id: categoryId,
        required_apps: csvToArray(supportedApps),
        compatibility: csvToArray(supportedApps),
        declared_permissions: csvToArray(permissions),
        installation_model: installModel,
        source_url: sourceUrl.trim() || undefined,
        documentation_url: docsUrl.trim() || undefined,
        version: version.trim(),
        changelog: changelog.trim(),
        screenshots: csvToArray(screenshots),
        support_url: contactEmail.trim() ? `mailto:${contactEmail.trim()}` : undefined,
        confirmed,
      });

      if (res.data?.validation) setValidation(res.data.validation);

      if (!res.ok) {
        toast({
          title: res.message ?? "Could not submit your listing",
          description: res.issues?.[0]?.message ?? res.error ?? undefined,
          variant: "error",
        });
        return;
      }

      toast({
        title: res.message ?? "Listing submitted",
        description: res.demo ? "Demo mode — not persisted." : undefined,
        variant: "success",
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Card className="flex flex-col gap-5">
        <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          Listing details
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-sm font-medium text-ink-muted">
            Name <span className="text-rose-300">*</span>
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 120))}
            maxLength={120}
            required
            placeholder="e.g. Notion Connector"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={shortId} className="text-sm font-medium text-ink-muted">
            Summary <span className="text-rose-300">*</span>
          </label>
          <input
            id={shortId}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value.slice(0, 160))}
            maxLength={160}
            required
            placeholder="One line describing what this plugin does."
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={longId} className="text-sm font-medium text-ink-muted">
            Long description <span className="text-rose-300">*</span>
          </label>
          <textarea
            id={longId}
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            rows={5}
            required
            placeholder="What it connects to, what it can do, and what it cannot access."
            className={cn(inputClass, "resize-y")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={categoryFieldId}
              className="text-sm font-medium text-ink-muted"
            >
              Category <span className="text-rose-300">*</span>
            </label>
            <select
              id={categoryFieldId}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className={cn(inputClass, "appearance-none")}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={versionId}
              className="text-sm font-medium text-ink-muted"
            >
              Version <span className="text-rose-300">*</span>
            </label>
            <input
              id={versionId}
              value={version}
              onChange={(e) => setVersion(e.target.value.slice(0, 40))}
              maxLength={40}
              required
              placeholder="1.0.0"
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
            <Plug className="h-4 w-4" aria-hidden />
          </span>
          Compatibility &amp; permissions
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={appsId} className="text-sm font-medium text-ink-muted">
            Supported apps
          </label>
          <textarea
            id={appsId}
            value={supportedApps}
            onChange={(e) => setSupportedApps(e.target.value)}
            rows={2}
            placeholder="Notion, Slack, Gmail"
            className={cn(inputClass, "resize-y")}
          />
          <p className="text-[12px] text-ink-faint">
            Comma or newline separated.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={permsId} className="text-sm font-medium text-ink-muted">
            Required permissions
          </label>
          <textarea
            id={permsId}
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
            rows={2}
            placeholder="read:pages, write:pages"
            className={cn(inputClass, "resize-y")}
          />
          <p className="text-[12px] text-ink-faint">
            List every permission this plugin needs. Be specific and honest.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm font-medium text-ink-muted">
            Installation model
          </legend>
          {INSTALL_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                installModel === opt.value
                  ? "border-accent-sky/40 bg-accent-sky/[0.06]"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
              )}
            >
              <input
                type="radio"
                name="install_model"
                value={opt.value}
                checked={installModel === opt.value}
                onChange={() => setInstallModel(opt.value)}
                className="mt-1 h-4 w-4 accent-accent-sky"
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  {opt.label}
                </span>
                <span className="block text-[13px] leading-relaxed text-ink-muted">
                  {opt.hint}
                </span>
              </span>
            </label>
          ))}
          <p className="text-[12px] text-ink-faint">
            Downloadable or executable packages are not accepted — listings are
            metadata-only.
          </p>
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
            <Send className="h-4 w-4" aria-hidden />
          </span>
          Links &amp; release notes
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={sourceId}
              className="text-sm font-medium text-ink-muted"
            >
              Source link{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id={sourceId}
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://github.com/you/plugin"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={docsId}
              className="text-sm font-medium text-ink-muted"
            >
              Documentation link{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id={docsId}
              type="url"
              value={docsUrl}
              onChange={(e) => setDocsUrl(e.target.value)}
              placeholder="https://docs.example.com"
              className={inputClass}
            />
          </div>
        </div>
        <p className="-mt-2 text-[12px] text-ink-faint">
          Links must be http(s) and must not point at executables or archives.
        </p>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={changelogId}
            className="text-sm font-medium text-ink-muted"
          >
            Changelog
          </label>
          <textarea
            id={changelogId}
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            rows={3}
            placeholder="What changed in this version?"
            className={cn(inputClass, "resize-y")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={screenshotsId}
            className="text-sm font-medium text-ink-muted"
          >
            Screenshot URLs{" "}
            <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <textarea
            id={screenshotsId}
            value={screenshots}
            onChange={(e) => setScreenshots(e.target.value)}
            rows={2}
            placeholder="https://example.com/screenshot.png"
            className={cn(inputClass, "resize-y")}
          />
          <p className="text-[12px] text-ink-faint">
            Link to images only — no file uploads. One per line.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-sm">
          <label htmlFor={emailId} className="text-sm font-medium text-ink-muted">
            Contact email
          </label>
          <input
            id={emailId}
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </Card>

      <Card className="relative flex flex-col gap-4 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-teal/10 blur-3xl"
        />
        <label
          htmlFor={confirmId}
          className={cn(
            "relative flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
            confirmed
              ? "border-emerald-400/30 bg-emerald-400/[0.06] shadow-glow-teal"
              : "border-amber-400/25 bg-amber-400/[0.05] hover:bg-amber-400/[0.08]",
          )}
        >
          <input
            id={confirmId}
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-400"
            required
          />
          <span className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
              aria-hidden
            />
            <span>{CONFIRM_TEXT}</span>
          </span>
        </label>

        {validation && validation.issues.length > 0 ? (
          <div className="relative">
            <IssueList issues={validation.issues} />
          </div>
        ) : null}

        <div className="relative">
          <Button
            type="submit"
            variant="primary"
            disabled={pending || !isSignedIn || !confirmed}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {pending ? "Submitting…" : "Submit listing for review"}
          </Button>
          {!isSignedIn ? (
            <p className="mt-2 text-[12px] text-ink-faint">
              Switch your demo identity to a creator from the account menu to
              submit.
            </p>
          ) : null}
        </div>
      </Card>
    </form>
  );
}
