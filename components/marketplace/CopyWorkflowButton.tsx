"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/marketplace/ui/ConfirmDialog";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { copyWorkflow } from "@/lib/marketplace/actions";

// ---------------------------------------------------------------------------
// CopyWorkflowButton — confirms via ConfirmDialog, then calls
// copyWorkflow(slug). On success, toasts the canonical success message:
// "Copied to your private Leda workspace. Review before enabling."
// Guests get a friendly "sign in (demo)" toast.
// ---------------------------------------------------------------------------

const GUEST_TOAST = "Sign in (demo) to do that";
const SUCCESS_MESSAGE =
  "Copied to your private Leda workspace. Review before enabling.";

export function CopyWorkflowButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    startTransition(async () => {
      const result = await copyWorkflow(slug);
      if (!result.ok) {
        toast({
          title: result.message ?? "Could not copy this workflow",
          description: result.error,
          variant: "error",
        });
        return;
      }
      toast({
        title: result.message ?? SUCCESS_MESSAGE,
        variant: "success",
      });
    });
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={handleClick}
        disabled={pending}
        className={className}
      >
        <Copy className="h-4 w-4" aria-hidden />
        {pending ? "Copying…" : "Copy to my workspace"}
      </Button>

      <ConfirmDialog
        open={open}
        title="Copy this workflow?"
        description="A private copy is added to your Leda workspace. It stays disabled until you review it and turn it on yourself — nothing runs automatically."
        confirmLabel="Copy workflow"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
