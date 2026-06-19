import { Clock } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

// The desktop app isn't downloadable yet — Leda is "coming soon". Every former
// "download" CTA now routes to the Preorder page (/download) where people can
// reserve early access with their email. No fake executable is ever offered.
export function DownloadButton({
  size = "lg",
  className,
  label = "Preorder Leda",
}: {
  size?: "md" | "lg";
  className?: string;
  label?: string;
}) {
  return (
    <ButtonLink href="/download" size={size} className={className}>
      <Clock size={16} />
      {label}
    </ButtonLink>
  );
}
