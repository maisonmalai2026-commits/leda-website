"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type State = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm({ demoMode }: { demoMode: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (name.trim().length < 2) return "Please enter your name.";
    if (!EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientError = validate();
    if (clientError) {
      setError(clientError);
      setState("error");
      return;
    }

    setState("submitting");
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, useCase }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="conic-border rounded-2xl">
        <Card className="grain relative overflow-hidden border-transparent p-8 text-center">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-80"
            style={{
              background:
                "radial-gradient(60% 70% at 50% 0%, rgba(45,212,191,0.18), transparent 65%)",
            }}
          />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl bg-accent-teal/30 blur-xl animate-glow-pulse"
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-teal/30 bg-gradient-to-br from-accent-blue/20 to-accent-teal/25 text-accent-teal shadow-glow-teal animate-fade-up">
              <CheckCircle2 size={30} />
            </span>
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink">
            You&apos;re on the <span className="text-gradient">list.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
            Thanks, {name.trim().split(" ")[0] || "there"} — we&apos;ll reach out at{" "}
            <span className="text-ink">{email.trim()}</span> when the next build is
            ready.
            {demoMode
              ? " (Demo mode: this submission was accepted but not stored.)"
              : ""}
          </p>
          <Button
            variant="secondary"
            className="mt-7"
            onClick={() => {
              setName("");
              setEmail("");
              setUseCase("");
              setState("idle");
            }}
          >
            Add another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <Card className="grain relative overflow-hidden p-7 sm:p-8">
      <div
        aria-hidden
        className="absolute -left-20 -top-24 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle,rgba(59,130,246,0.32),transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Join the <span className="text-gradient">waitlist</span>
            </h2>
            <p className="text-sm text-ink-muted">A few details and you&apos;re in.</p>
          </div>
        </div>

        {demoMode ? (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>
              Demo mode — submissions are validated and acknowledged but not stored.
              Set <code className="font-mono">WAITLIST_STORAGE_MODE=local</code> to
              persist them.
            </span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              required
            />
          </Field>

          <Field
            label="What would you use Leda for?"
            htmlFor="useCase"
            optional
          >
            <textarea
              id="useCase"
              name="useCase"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="e.g. preparing class reminders and summarizing notes"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </Field>

          {state === "error" && error ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={state === "submitting"}
          >
            {state === "submitting" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Joining…
              </>
            ) : (
              "Join the waitlist"
            )}
          </Button>

          <p className="text-center text-xs leading-relaxed text-ink-faint">
            We only use your email to share Leda updates. No spam, and we never ask
            for secrets or API keys here.
          </p>
        </form>
      </div>
    </Card>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/[0.1] bg-base/50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 hover:border-white/[0.16] focus:border-accent-teal/50 focus:bg-base/70 focus:outline-none focus:ring-2 focus:ring-accent-cyan/30 focus:shadow-glow-teal";

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-center gap-2 text-sm font-medium text-ink"
      >
        {label}
        {optional ? (
          <span className="text-xs font-normal text-ink-faint">Optional</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
