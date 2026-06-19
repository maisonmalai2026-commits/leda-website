import type { Metadata } from "next";
import { Lock, Eye, KeyRound, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card, SectionHeading } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy & Safety",
  description:
    "How Leda treats your data: private by default, you choose what to connect, and you review sensitive actions before they happen. Here's what Leda does not do.",
};

const principles = [
  {
    icon: Eye,
    title: "No silent reading of private data",
    body: "Leda should not silently read private data. It works with what you choose to share with it.",
  },
  {
    icon: ShieldCheck,
    title: "You choose what to connect",
    body: "You decide which tools and accounts to connect. Nothing is connected on your behalf.",
  },
  {
    icon: CheckCircle2,
    title: "Review before sensitive actions",
    body: "You review sensitive actions before anything is sent, posted, deleted, or changed.",
  },
  {
    icon: KeyRound,
    title: "Your API keys stay private",
    body: "API keys should stay private and are never displayed in public profiles.",
  },
  {
    icon: Lock,
    title: "Clear permission declarations",
    body: "Community plugins are planned to use clear permission declarations you can read.",
  },
  {
    icon: CheckCircle2,
    title: "Evidence for important actions",
    body: "Important actions should show verification evidence where possible, not just claim success.",
  },
];

const doesNot = [
  "Does not sell personal data",
  "Does not automatically upload private files",
  "Does not silently access passwords",
  "Does not run unknown code without approval",
  "Does not claim success without verification for important tasks",
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy & Safety"
        title="Private by default. Reviewable by design."
        description="Trust is the whole point of an operating layer. Here's how Leda is meant to handle your data and your decisions — in plain language."
      />

      <Section>
        <SectionHeading
          eyebrow="Our commitments"
          title="What you should expect from Leda."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <Card key={p.title} className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-base/50 text-accent-teal">
                <p.icon size={18} />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* WHAT LEDA DOES NOT DO */}
      <Section className="pt-0">
        <Card className="border-rose-400/15 bg-rose-400/[0.03] p-8 sm:p-10">
          <div className="flex items-center gap-2 text-rose-300">
            <X size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Boundaries
            </span>
          </div>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            What Leda does not do.
          </h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {doesNot.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-base/40 px-4 py-3.5 text-sm text-ink"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-rose-300">
                  <X size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section className="pt-0">
        <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-ink-faint">
          This page describes how Leda is designed to behave as an early
          prototype. It is not a legal policy document. A formal privacy policy
          will accompany any public release that handles personal data.
        </p>
      </Section>
    </>
  );
}
