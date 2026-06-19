import { cn } from "@/lib/cn";

/**
 * Marquee — an infinite horizontal scroll strip (pure CSS). Children are
 * duplicated once so the loop is seamless; edges fade via mask-fade-x.
 */
export function Marquee({
  children,
  className,
  reverse = false,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div className={cn("mask-fade-x group flex overflow-hidden", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 pr-3 animate-marquee group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
