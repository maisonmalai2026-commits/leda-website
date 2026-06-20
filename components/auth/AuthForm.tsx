"use client";

// ============================================================================
// AuthForm — the email/password + Google sign-in card used by /login + /signup.
//
// These pages live OUTSIDE the marketplace ToastProvider, so this component
// uses local message state (not useToast). It is fully demo-safe: when
// `demoMode` is true the actions short-circuit to a friendly message and the
// form is visibly present but disabled.
// ============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/marketplace/auth-actions";

type Mode = "login" | "signup";
type Status = "idle" | "submitting" | "google";
type Feedback = { kind: "error" | "success"; text: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode, demoMode }: { mode: Mode; demoMode: boolean }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const busy = status !== "idle";
  const disabled = demoMode || busy;

  function clientValidate(): string | null {
    if (!EMAIL_RE.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (isSignup && displayName.trim().length > 0 && displayName.trim().length < 2) {
      return "Display name must be at least 2 characters.";
    }
    return null;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    const invalid = clientValidate();
    if (invalid) {
      setFeedback({ kind: "error", text: invalid });
      return;
    }

    setStatus("submitting");
    setFeedback(null);

    try {
      const result = isSignup
        ? await signUpWithEmail({
            email: email.trim(),
            password,
            displayName: displayName.trim() || undefined,
          })
        : await signInWithEmail({ email: email.trim(), password });

      if (!result.ok) {
        setFeedback({
          kind: "error",
          text: result.message ?? "Something went wrong. Please try again.",
        });
        setStatus("idle");
        return;
      }

      // On signup, Supabase may require email confirmation before a session
      // exists — the action returns a "check your email" message and no redirect
      // should happen. Detect that by the absence of an active redirect signal:
      // we treat any signup success whose message mentions confirming the email
      // as "stay put and show the message".
      const needsConfirmation =
        isSignup && /confirm/i.test(result.message ?? "");

      if (needsConfirmation) {
        setFeedback({
          kind: "success",
          text: result.message ?? "Check your email to confirm your account.",
        });
        setStatus("idle");
        return;
      }

      // Real session established → refresh server components, then go to /account.
      setFeedback({ kind: "success", text: result.message ?? "Signed in." });
      router.refresh();
      router.push("/account");
    } catch {
      setFeedback({
        kind: "error",
        text: "Something went wrong. Please try again.",
      });
      setStatus("idle");
    }
  }

  async function handleGoogle() {
    if (disabled) return;
    setStatus("google");
    setFeedback(null);

    try {
      const result = await signInWithGoogle();
      if (result.ok && result.data?.url) {
        window.location.assign(result.data.url);
        return; // navigating away — keep the spinner up.
      }
      setFeedback({
        kind: "error",
        text: result.message ?? "Could not start Google sign-in.",
      });
      setStatus("idle");
    } catch {
      setFeedback({
        kind: "error",
        text: "Could not start Google sign-in.",
      });
      setStatus("idle");
    }
  }

  return (
    <div className="relative">
      {demoMode ? (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-200"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>
            Demo mode — real accounts need Supabase configured (see setup). You can
            still browse the marketplace with the demo role switcher.
          </span>
        </div>
      ) : null}

      {/* Google — prominent secondary action. */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={disabled}
        aria-label="Continue with Google"
        className="group/btn relative inline-flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] text-[15px] font-medium text-ink transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        {status === "google" ? (
          <Loader2 size={18} className="animate-spin" aria-hidden />
        ) : (
          <GoogleGlyph />
        )}
        <span>Continue with Google</span>
      </button>

      <div className="my-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint">
          or
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
        {isSignup ? (
          <Field label="Display name" htmlFor="auth-display-name" optional>
            <InputWithIcon icon={<User size={16} aria-hidden />}>
              <input
                id="auth-display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                disabled={disabled}
                className={inputClass}
              />
            </InputWithIcon>
          </Field>
        ) : null}

        <Field label="Email" htmlFor="auth-email">
          <InputWithIcon icon={<Mail size={16} aria-hidden />}>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={disabled}
              required
              aria-required="true"
              className={inputClass}
            />
          </InputWithIcon>
        </Field>

        <Field label="Password" htmlFor="auth-password">
          <InputWithIcon icon={<Lock size={16} aria-hidden />}>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              minLength={8}
              disabled={disabled}
              required
              aria-required="true"
              aria-describedby={isSignup ? "auth-password-hint" : undefined}
              className={inputClass}
            />
          </InputWithIcon>
          {isSignup ? (
            <p id="auth-password-hint" className="mt-1.5 text-xs text-ink-faint">
              Use 8 or more characters.
            </p>
          ) : null}
        </Field>

        {feedback ? (
          <div
            role={feedback.kind === "error" ? "alert" : "status"}
            className={
              feedback.kind === "error"
                ? "flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
                : "flex items-start gap-2 rounded-xl border border-accent-teal/25 bg-accent-teal/10 px-4 py-3 text-sm text-accent-teal"
            }
          >
            {feedback.kind === "error" ? (
              <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
            ) : (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={disabled}
        >
          {status === "submitting" ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              {isSignup ? "Creating account…" : "Signing in…"}
            </>
          ) : isSignup ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

const inputClass =
  "w-full rounded-xl border border-white/[0.1] bg-black/30 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 hover:border-white/[0.16] focus:border-accent-cyan/50 focus:bg-black/40 focus:outline-none focus:ring-2 focus:ring-accent-cyan/30 disabled:cursor-not-allowed disabled:opacity-60";

function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
        {icon}
      </span>
      {children}
    </div>
  );
}

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

/** Inline Google "G" mark (no external asset). */
function GoogleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden
      focusable="false"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
