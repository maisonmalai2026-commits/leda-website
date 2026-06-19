import { Info } from "lucide-react";

import { getMarketplaceFlags } from "@/lib/marketplace/config";
import { getSessionUser } from "@/lib/marketplace/auth";
import { MarketplaceSubnav } from "@/components/marketplace/MarketplaceSubnav";
import { ToastProvider } from "@/components/marketplace/ui/Toast";
import { Container } from "@/components/ui/Container";

// Route-group layout for every /marketplace, /creator, and /u surface. The root
// layout already renders the global Navbar + Footer + <html>, so this only adds
// the marketplace chrome (toasts, secondary nav, demo banner) around children.
export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const flags = getMarketplaceFlags();
  const sessionUser = await getSessionUser();

  return (
    <ToastProvider>
      <MarketplaceSubnav sessionUser={sessionUser} flags={flags} />

      {flags.demoMode ? (
        <div
          role="note"
          aria-label="Demo mode notice"
          className="border-b border-accent-sky/20 bg-accent-sky/[0.06]"
        >
          <Container className="flex items-center gap-2.5 py-2 text-[13px] text-ink-muted">
            <Info
              className="h-4 w-4 shrink-0 text-accent-sky"
              aria-hidden
            />
            <p className="leading-relaxed">
              <span className="font-medium text-ink">Demo mode</span> — exploring
              with seed data; sign-in below is a local demo identity.
            </p>
          </Container>
        </div>
      ) : null}

      <Container className="py-8 sm:py-10">{children}</Container>
    </ToastProvider>
  );
}
