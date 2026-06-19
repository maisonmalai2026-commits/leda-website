import type { Metadata } from "next";
import "./globals.css";
import { Background } from "@/components/Background";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s · Leda",
  },
  description: site.description,
  applicationName: "Leda",
  keywords: [
    "Leda",
    "AI workspace",
    "AI operating layer",
    "workflows",
    "desktop AI",
    "plugins",
  ],
  authors: [{ name: "Leda" }],
  openGraph: {
    type: "website",
    siteName: "Leda",
    title: site.title,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:ring-2 focus:ring-accent-sky"
        >
          Skip to content
        </a>
        <Background />
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
