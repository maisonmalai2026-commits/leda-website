import type { Metadata } from "next";
import { Mail, Github, Linkedin, MessageCircle } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { WaitlistForm } from "@/components/contact/WaitlistForm";
import { site, config } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Waitlist",
  description:
    "Join the Leda waitlist or get in touch. Tell us what you'd use Leda for, and we'll keep you posted as the prototype grows.",
};

const socials = [
  { label: "X", href: "#", icon: MessageCircle },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "GitHub", href: config.githubUrl, icon: Github },
];

export default function ContactPage() {
  const demoMode = (process.env.WAITLIST_STORAGE_MODE ?? "demo") !== "local";

  return (
    <>
      <PageHeader
        eyebrow="Waitlist"
        title="Be early to Leda."
        description="Leda is an early prototype. Join the waitlist to follow progress and get a heads-up when the Windows build is ready."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WaitlistForm demoMode={demoMode} />

          <div className="space-y-5">
            <Card className="p-7">
              <h2 className="text-base font-semibold text-ink">Get in touch</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Questions, feedback, or interested in testing? Reach out directly.
              </p>

              <a
                href={`mailto:${site.email}`}
                className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-base/40 px-4 py-3.5 transition-colors hover:border-white/[0.16]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-teal/20 text-accent-sky">
                  <Mail size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">Email</span>
                  <span className="block text-sm text-ink-muted">{site.email}</span>
                </span>
              </a>

              <div className="mt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Follow along
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-base/40 px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-white/[0.16] hover:text-ink"
                    >
                      <s.icon size={15} />
                      {s.label}
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-faint">
                  Social links are placeholders for now.
                </p>
              </div>
            </Card>

            <Card className="border-white/[0.06] bg-surface/40 p-6">
              <p className="text-sm leading-relaxed text-ink-muted">
                We collect only your name, email, and an optional note. We never
                ask for passwords or API keys here, and your details are used only
                to share Leda updates.
              </p>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
