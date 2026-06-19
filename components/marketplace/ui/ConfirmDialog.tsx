"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, the confirm button uses a destructive (rose) style. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Accessible modal: role="dialog" aria-modal, Esc to close, backdrop click to
// cancel, and a simple focus trap that keeps Tab within the dialog. Returns
// focus to the previously-focused element on close.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const getFocusable = useCallback((): HTMLElement[] => {
    const root = panelRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }, []);

  // Record focus, move focus into the dialog, and restore it on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    // Default focus to the confirm action for quick keyboard confirmation.
    const id = window.requestAnimationFrame(() => confirmRef.current?.focus());
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
        onCancel();
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
  }, [open, onCancel, getFocusable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      // Backdrop click cancels. Inner panel stops propagation.
      onMouseDown={onCancel}
    >
      <div
        className="absolute inset-0 bg-black/70"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-white/[0.10] bg-surface-raised p-6 shadow-card animate-fade-up",
        )}
      >
        <div className="flex items-start gap-3">
          {destructive ? (
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-400/10 text-rose-300">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-base font-semibold text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descId}
                className="mt-1.5 text-sm leading-relaxed text-ink-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "secondary" : "primary"}
            className={cn(
              destructive &&
                "border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 hover:border-rose-400/50",
            )}
            onClick={onConfirm}
          >
            {/* confirmRef is attached via the rendered <button> ancestor. */}
            <span ref={confirmRefAttacher(confirmRef)}>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// The shared Button does not forward refs, so we focus the rendered confirm
// button by attaching to a child span and walking up to its <button>.
function confirmRefAttacher(ref: React.MutableRefObject<HTMLButtonElement | null>) {
  return (el: HTMLSpanElement | null) => {
    if (el) {
      const button = el.closest("button");
      ref.current = button as HTMLButtonElement | null;
    }
  };
}
