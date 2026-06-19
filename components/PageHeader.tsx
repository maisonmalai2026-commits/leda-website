import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Badge";

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
    <header className="border-b border-white/[0.06] pb-12 pt-14 sm:pt-20">
      <Container>
        <div className="max-w-2xl">
          {eyebrow ? <Pill>{eyebrow}</Pill> : null}
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-7">{children}</div> : null}
        </div>
      </Container>
    </header>
  );
}
