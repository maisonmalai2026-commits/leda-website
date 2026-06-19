"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  PencilLine,
  BadgeCheck,
  Archive,
  Ban,
} from "lucide-react";

import { moderateContent } from "@/lib/marketplace/actions";
import type { TargetType } from "@/lib/marketplace/types";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/marketplace/ui/ConfirmDialog";
import { useToast } from "@/components/marketplace/ui/Toast";
import { cn } from "@/lib/cn";

// One concrete moderation action exposed in the queue. `action` is the verb sent
// to the moderateContent server action; `requiresReason` forces the moderator to
// type a justification before the action can run (Reject / Request changes).
interface ActionDef {
  action: string;
  label: string;
  Icon: typeof CheckCircle2;
  requiresReason?: boolean;
  destructive?: boolean;
  tone: string;
}

const ACTIONS: ActionDef[] = [
  {
    action: "approve",
    label: "Approve",
    Icon: CheckCircle2,
    tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20",
  },
  {
    action: "request_changes",
    label: "Request changes",
    Icon: PencilLine,
    requiresReason: true,
    tone: "border-sky-400/30 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20",
  },
  {
    action: "reject",
    label: "Reject",
    Icon: XCircle,
    requiresReason: true,
    destructive: true,
    tone: "border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20",
  },
  {
    action: "mark_verified",
    label: "Mark verified",
    Icon: BadgeCheck,
    tone: "border-accent-sky/30 bg-accent-sky/10 text-accent-sky hover:bg-accent-sky/20",
  },
  {
    action: "mark_deprecated",
    label: "Mark deprecated",
    Icon: Archive,
    tone: "border-white/12 bg-white/[0.05] text-ink-muted hover:bg-white/[0.09]",
  },
  {
    action: "remove",
    label: "Remove",
    Icon: Ban,
    requiresReason: true,
    destructive: true,
    tone: "border-rose-400/30 bg-rose-400/[0.08] text-rose-200 hover:bg-rose-400/20",
  },
];

export function ModerationActions({
  targetType,
  targetId,
  targetLabel,
}: {
  targetType: TargetType;
  targetId: string;
  /** Human-readable title used in the confirmation copy. */
  targetLabel: string;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  // The action awaiting confirmation in the dialog, or null when closed.
  const [pendingAction, setPendingAction] = useState<ActionDef | null>(null);

  function requestAction(def: ActionDef) {
    if (def.requiresReason && reason.trim().length === 0) {
      toast({
        title: "Reason required",
        description: `Add a short reason before you ${def.label.toLowerCase()}.`,
        variant: "error",
      });
      return;
    }
    setPendingAction(def);
  }

  function runAction(def: ActionDef) {
    setPendingAction(null);
    startTransition(async () => {
      const result = await moderateContent({
        targetType,
        targetId,
        action: def.action,
        reason: reason.trim() || undefined,
      });
      toast({
        title: result.ok ? `${def.label} recorded` : "Action failed",
        description: result.message,
        variant: result.ok ? "success" : "error",
      });
      if (result.ok) setReason("");
    });
  }

  const reasonId = `mod-reason-${targetType}-${targetId}`;

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor={reasonId}
          className="mb-1.5 block text-xs font-medium text-ink-muted"
        >
          Reason / note{" "}
          <span className="text-ink-faint">
            (required for reject, request changes, remove)
          </span>
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Explain the decision for the audit log…"
          className={cn(
            "w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
          )}
        />
      </div>

      <div
        role="group"
        aria-label={`Moderation actions for ${targetLabel}`}
        className="flex flex-wrap gap-2"
      >
        {ACTIONS.map((def) => {
          const Icon = def.Icon;
          return (
            <button
              key={def.action}
              type="button"
              disabled={isPending}
              onClick={() => requestAction(def)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                "disabled:cursor-not-allowed disabled:opacity-50",
                def.tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {def.label}
            </button>
          );
        })}
      </div>

      <p className="text-[12px] leading-relaxed text-ink-faint">
        A human moderator action is always required — nothing here is
        auto-approved. AI may assist with summaries only.
      </p>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction
            ? `${pendingAction.label} this ${targetType}?`
            : "Confirm"
        }
        description={
          pendingAction
            ? `"${targetLabel}" — ${
                reason.trim()
                  ? `Reason: ${reason.trim()}`
                  : "No reason provided."
              } This is recorded in the audit log (not persisted in demo mode).`
            : undefined
        }
        confirmLabel={pendingAction?.label ?? "Confirm"}
        destructive={pendingAction?.destructive}
        onConfirm={() => pendingAction && runAction(pendingAction)}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
