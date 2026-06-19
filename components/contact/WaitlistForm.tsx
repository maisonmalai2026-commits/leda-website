"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-teal">
          <CheckCircle2 size={26} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">You&apos;re on the list.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Thanks, {name.trim().split(" ")[0] || "there"} — we&apos;ll reach out at{" "}
          <span className="text-ink">{email.trim()}</span> when the next build is
          ready.
          {demoMode
            ? " (Demo mode: this submission was accepted but not stored.)"
            : ""}
        </p>
        <Button
          variant="secondary"
          className="mt-6"
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
    );
  }

  return (
    <Card className="p-7">
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
    </Card>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/[0.1] bg-base/50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent-teal/40 focus:outline-none focus:ring-2 focus:ring-accent-sky/30";

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
