"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type State = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Preorder email capture. Collects only an email and posts to /api/preorder.
 * Used in place of a (not-yet-available) download — Leda is "coming soon".
 */
export function PreorderForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      setState("error");
      return;
    }
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/preorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");
      setDemo(data.mode === "demo");
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-accent-teal/25 bg-accent-teal/[0.06] px-5 py-4 text-sm text-ink shadow-glow-teal">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal animate-fade-up">
          <CheckCircle2 size={18} />
        </span>
        <span>
          You&apos;re on the preorder list — we&apos;ll email{" "}
          <span className="text-ink">{email.trim()}</span> the moment Leda is ready.
          {demo ? " (Demo mode: not stored.)" : ""}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={compact ? "" : "max-w-md"}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="h-12 w-full rounded-xl border border-white/[0.1] bg-black/30 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent-cyan/40 focus:outline-none focus:ring-2 focus:ring-accent-cyan/30"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={state === "submitting"}>
          {state === "submitting" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Preorder
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>

      {state === "error" && error ? (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-200"
        >
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-ink-faint">
        Just your email to reserve early access — no payment, no spam. We never ask
        for passwords or keys.
      </p>
    </form>
  );
}
