import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-surface p-6 shadow-card",
        interactive &&
          "transition-colors duration-200 hover:border-white/[0.16] hover:bg-surface-raised",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
