import { Download } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { config } from "@/lib/site";
import { cn } from "@/lib/cn";

// Reads NEXT_PUBLIC_LEDA_WINDOWS_DOWNLOAD_URL. When it is empty, the button is
// disabled and reads "Windows download coming soon" — no fake executable.
export function DownloadButton({
  size = "lg",
  className,
  label = "Download for Windows",
}: {
  size?: "md" | "lg";
  className?: string;
  label?: string;
}) {
  const url = config.windowsDownloadUrl;

  if (!url) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] font-medium text-ink-muted",
          size === "lg" ? "h-12 px-6 text-[15px]" : "h-10 px-4 text-sm",
          className,
        )}
        aria-disabled="true"
        title="A public download is not available yet."
      >
        <Download size={16} />
        Windows download coming soon
      </span>
    );
  }

  return (
    <ButtonLink href={url} external size={size} className={className}>
      <Download size={16} />
      {label}
    </ButtonLink>
  );
}
