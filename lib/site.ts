// Central site configuration: brand strings, navigation, and runtime config
// derived from environment variables. Keeping this in one place makes the rest
// of the app easy to read and update.

export const site = {
  name: "Leda",
  title: "Leda — Your AI Operating Layer",
  tagline: "One AI workspace for your digital life.",
  secondary:
    "Choose your AI brain. Connect your tools. Build workflows that work for you.",
  description:
    "Leda is a desktop-first AI workspace where you choose an AI brain, use trusted plugins, and build workflows from natural language — all in one private chat interface.",
  // Used for canonical URLs and Open Graph. Override with NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://leda.example",
  email: "hello@leda.ai",
};

export const config = {
  // Empty string when not configured — the download button reads this to decide
  // whether to link out or show "Windows download coming soon".
  windowsDownloadUrl: process.env.NEXT_PUBLIC_LEDA_WINDOWS_DOWNLOAD_URL ?? "",
  githubUrl:
    process.env.NEXT_PUBLIC_LEDA_GITHUB_URL ?? "https://github.com",
};

export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Product", href: "/" },
  { label: "Workflows", href: "/workflows" },
  { label: "Plugins", href: "/plugins" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Vision", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Preorder", href: "/download" },
];

export const footerNav: NavItem[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Privacy", href: "/privacy" },
  { label: "Changelog", href: "/changelog" },
  { label: "Contact", href: "/contact" },
  { label: "Workflows", href: "/workflows" },
  { label: "Plugins", href: "/plugins" },
];

export const socialLinks = [
  { label: "X", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "GitHub", href: config.githubUrl },
];
