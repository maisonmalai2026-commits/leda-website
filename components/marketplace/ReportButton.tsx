"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { submitReport } from "@/lib/marketplace/actions";
import type { TargetType } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// ReportButton — opens a small accessible dialog with a reason select + an
// optional details field, then calls submitReport. Uses useToast. Guests get a
// friendly "sign in (demo)" toast and the dialog does not open.
// ---------------------------------------------------------------------------

const GUEST_TOAST = "Sign in (demo) to do that";

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "malicious", label: "Malicious or unsafe content" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright or trademark issue" },
  { value: "other", label: "Something else" },
] as const;

const MAX_DETAILS = 500;

export function ReportButton({
  targetType,
  targetId,
  className,
}: {
  targetType: TargetType;
  targetId: string;
  className?: string;
}) {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  const titleId = useId();
  const reasonId = useId();
  const detailsId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const getFocusable = useCallback((): HTMLElement[] => {
    const root = panelRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }, []);

  // Record + restore focus; move focus into the dialog on open.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const id = window.requestAnimationFrame(() => selectRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(id);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Esc to close + Tab focus trap.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeEl = document.activeElement;
        if (e.shiftKey) {
          if (activeEl === first || !panelRef.current?.contains(activeEl)) {
            e.preventDefault();
            last.focus();
          }
        } else if (activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close, getFocusable]);

  function handleOpen() {
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      if (!result.ok) {
        toast({
          title: result.message ?? "Could not submit your report",
          description: result.error,
          variant: "error",
        });
        return;
      }
      setOpen(false);
      setReason(REASONS[0].value);
      setDetails("");
      toast({
        title: result.message ?? "Report received",
        description: "Thanks — our team will review this.",
        variant: "success",
      });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-transparent px-3 py-1.5 text-sm font-medium text-ink-faint transition-colors",
          "hover:border-white/20 hover:text-ink-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
          className,
        )}
      >
        <Flag className="h-4 w-4" aria-hidden />
        Report
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          onMouseDown={close}
        >
          <div className="absolute inset-0 bg-black/70" aria-hidden />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-white/[0.10] bg-surface-raised p-6 shadow-card animate-fade-up"
          >
            <h2 id={titleId} className="text-base font-semibold text-ink">
              Report this content
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Tell us what's wrong. Reports are reviewed by a human moderator.
            </p>

            <form onSubmit={handleSubmit} className="mt-5">
              <div>
                <label
                  htmlFor={reasonId}
                  className="mb-1.5 block text-sm font-medium text-ink-muted"
                >
                  Reason
                </label>
                <select
                  id={reasonId}
                  ref={selectRef}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={pending}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink focus:border-accent-sky/40 focus:outline-none focus:ring-2 focus:ring-accent-sky/40 disabled:opacity-60"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value} className="bg-surface-raised">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor={detailsId}
                  className="mb-1.5 block text-sm font-medium text-ink-muted"
                >
                  Details{" "}
                  <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <textarea
                  id={detailsId}
                  value={details}
                  onChange={(e) =>
                    setDetails(e.target.value.slice(0, MAX_DETAILS))
                  }
                  disabled={pending}
                  rows={3}
                  maxLength={MAX_DETAILS}
                  placeholder="Add any context that helps us review faster."
                  className="w-full resize-y rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent-sky/40 focus:outline-none focus:ring-2 focus:ring-accent-sky/40 disabled:opacity-60"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={pending}>
                  {pending ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
