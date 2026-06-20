"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { signOut } from "@/lib/marketplace/auth-actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Signs the current user out via the auth-actions contract, then sends them to
 * the home page and refreshes server components so the session is cleared from
 * the UI. Demo-safe: signOut() returns {ok:false, demo:true} in demo mode and
 * never throws, so we still navigate home.
 */
export function SignOutButton({
  className,
  variant = "secondary",
  size = "md",
}: {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function handleSignOut() {
    if (busy || pending) return;
    setBusy(true);
    startTransition(async () => {
      try {
        await signOut();
      } finally {
        router.push("/");
        router.refresh();
        setBusy(false);
      }
    });
  }

  const isBusy = busy || pending;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isBusy}
      aria-label="Sign out"
      className={cn(className)}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden />
      )}
      Sign out
    </Button>
  );
}
