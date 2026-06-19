import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/fx/motion";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/[0.06] pb-14 pt-16 sm:pt-24">
      <div
        aria-hidden
        className="absolute -top-24 left-1/3 h-64 w-[40rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.25), rgba(139,92,246,0.18) 50%, transparent 70%)",
        }}
      />
      <Container>
        <Reveal className="max-w-2xl">
          {eyebrow ? (
            <div className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse-soft" />
              {eyebrow}
            </div>
          ) : null}
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-7">{children}</div> : null}
        </Reveal>
      </Container>
    </header>
  );
}
