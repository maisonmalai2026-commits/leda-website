import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

// Consistent vertical rhythm for page sections.
export function Section({
  children,
  className,
  containerClassName,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-14 sm:py-20", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
