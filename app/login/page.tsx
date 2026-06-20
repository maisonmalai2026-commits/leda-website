import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/fx/motion";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSessionUser } from "@/lib/marketplace/auth";
import { isDemoMode } from "@/lib/marketplace/config";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Sign in to your Leda account to manage your profile, workflows, and plugins.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }

  const demoMode = isDemoMode();

  return (
    <section className="relative isolate overflow-hidden py-16 sm:py-24">
      {/* Aurora glow backdrop. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[40rem] w-[60rem] max-w-none -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.22), rgba(139,92,246,0.16) 50%, transparent 70%)",
        }}
      />

      <Container>
        <div className="mx-auto w-full max-w-md">
          <Reveal>
            <div className="mb-8 text-center">
              <div className="eyebrow justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse-soft" />
                Welcome back
              </div>
              <h1 className="mt-5 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Log in to <span className="text-gradient">Leda</span>
              </h1>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-ink-muted">
                Pick up where you left off — your profile, library, and creator
                tools are waiting.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="conic-border rounded-2xl">
              <div className="grain relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0E18]/80 p-7 shadow-card backdrop-blur-[2px] sm:p-8">
                <div
                  aria-hidden
                  className="absolute -left-20 -top-24 h-56 w-56 rounded-full opacity-40 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle,rgba(34,211,238,0.28),transparent 70%)",
                  }}
                />
                <div className="relative">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-accent-cyan">
                      <Sparkles size={18} aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-ink">
                        Sign in
                      </h2>
                      <p className="text-sm text-ink-muted">
                        Email or your Google account.
                      </p>
                    </div>
                  </div>

                  <AuthForm mode="login" demoMode={demoMode} />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-6 text-center text-sm text-ink-muted">
              New to Leda?{" "}
              <Link
                href="/signup"
                className="font-medium text-accent-cyan underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/70 rounded"
              >
                Create an account
              </Link>
            </p>
            <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
              By continuing you agree to be emailed occasional product updates. No
              spam, and you can unsubscribe anytime.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
