import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { Container } from "@/components/ui/Container";
import { footerNav, site, socialLinks, config } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative mt-28 overflow-hidden border-t border-white/[0.07]">
      <div
        aria-hidden
        className="absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.3), rgba(139,92,246,0.2) 55%, transparent 70%)",
        }}
      />
      <Container className="relative py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                Leda
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              {site.tagline} A desktop-first AI workspace built for thoughtful
              automation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn title="Product">
              {footerNav.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {item.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Company">
              <FooterLink href="/about">Vision</FooterLink>
              <FooterLink href="/download">Preorder</FooterLink>
              <FooterLink href="/contact">Join waitlist</FooterLink>
            </FooterColumn>

            <FooterColumn title="Connect">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block py-1 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  {s.label}
                </a>
              ))}
            </FooterColumn>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-sm text-ink-faint sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Leda. Built for thoughtful automation.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-ink-muted">
              Privacy &amp; Safety
            </Link>
            <a
              href={config.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink-muted"
            >
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block py-1 text-sm text-ink-muted transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}
