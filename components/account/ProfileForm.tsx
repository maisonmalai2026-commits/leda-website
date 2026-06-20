"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

import { updateProfile } from "@/lib/marketplace/auth-actions";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/lib/marketplace/types";
import { cn } from "@/lib/cn";

const HANDLE_PATTERN = "^[a-z0-9_]{2,32}$";
const HANDLE_RE = /^[a-z0-9_]{2,32}$/;

type Status =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const inputClass = cn(
  "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-ink",
  "placeholder:text-ink-faint transition-colors",
  "focus:border-accent-cyan/40 focus:outline-none focus:ring-2 focus:ring-accent-cyan/30",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

/**
 * Edit form for the signed-in user's own profile. Consumes updateProfile() from
 * the auth-actions contract. In demo mode the action is a no-op that returns
 * {ok:false, demo:true}; the form disables its fields and shows a notice so the
 * user understands why nothing persists.
 */
export function ProfileForm({
  profile,
  demoMode,
}: {
  profile: Profile;
  demoMode: boolean;
}) {
  const router = useRouter();
  const baseId = useId();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [handleError, setHandleError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");

  const displayNameId = `${baseId}-display-name`;
  const handleId = `${baseId}-handle`;
  const handleHintId = `${baseId}-handle-hint`;
  const bioId = `${baseId}-bio`;
  const websiteId = `${baseId}-website`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || demoMode) return;

    setStatus({ kind: "idle" });

    const trimmedHandle = handle.trim();
    if (trimmedHandle.length > 0 && !HANDLE_RE.test(trimmedHandle)) {
      setHandleError(
        "Handle must be 2–32 characters: lowercase letters, numbers, or underscores.",
      );
      return;
    }
    setHandleError(null);

    startTransition(async () => {
      const result = await updateProfile({
        display_name: displayName.trim(),
        handle: trimmedHandle,
        bio: bio.trim(),
        website_url: websiteUrl.trim(),
      });

      if (result.ok) {
        setStatus({
          kind: "success",
          message: result.message ?? "Profile updated.",
        });
        router.refresh();
      } else {
        setStatus({
          kind: "error",
          message:
            result.message ??
            result.error ??
            "Could not update your profile. Please try again.",
        });
      }
    });
  }

  const disabled = demoMode || pending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {demoMode ? (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-xl border border-accent-sky/20 bg-accent-sky/[0.06] px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-sky" aria-hidden />
          <span>
            Editing is disabled in demo mode. Connect Supabase to enable real
            accounts and save changes.
          </span>
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor={displayNameId}
          className="block text-sm font-medium text-ink"
        >
          Display name
        </label>
        <input
          id={displayNameId}
          name="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={disabled}
          maxLength={80}
          autoComplete="name"
          className={inputClass}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={handleId} className="block text-sm font-medium text-ink">
          Handle
        </label>
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-sm text-ink-faint">
            @
          </span>
          <input
            id={handleId}
            name="handle"
            type="text"
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value);
              if (handleError) setHandleError(null);
            }}
            disabled={disabled}
            pattern={HANDLE_PATTERN}
            inputMode="text"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={handleHintId}
            aria-invalid={handleError ? true : undefined}
            className={inputClass}
            placeholder="your_handle"
          />
        </div>
        <p id={handleHintId} className="text-xs text-ink-faint">
          2–32 characters: lowercase letters, numbers, and underscores
          (matches{" "}
          <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-ink-muted">
            ^[a-z0-9_]{"{"}2,32{"}"}$
          </code>
          ).
        </p>
        {handleError ? (
          <p className="flex items-center gap-1.5 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {handleError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={bioId} className="block text-sm font-medium text-ink">
          Bio
        </label>
        <textarea
          id={bioId}
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={disabled}
          rows={4}
          maxLength={500}
          className={cn(inputClass, "resize-y")}
          placeholder="Tell the community a little about yourself."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={websiteId} className="block text-sm font-medium text-ink">
          Website
        </label>
        <input
          id={websiteId}
          name="website_url"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          disabled={disabled}
          autoComplete="url"
          className={inputClass}
          placeholder="https://example.com"
        />
      </div>

      {status.kind !== "idle" ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed",
            status.kind === "success"
              ? "border-accent-teal/25 bg-accent-teal/[0.07] text-ink"
              : "border-red-400/25 bg-red-500/[0.07] text-ink",
          )}
        >
          {status.kind === "success" ? (
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-accent-teal"
              aria-hidden
            />
          ) : (
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-300"
              aria-hidden
            />
          )}
          <span>{status.message}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={disabled}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
