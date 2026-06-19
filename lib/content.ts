// Mock data layer. The site reads all of its workflow / plugin / changelog
// content from the JSON files in /content. Edit those files to add or change
// cards — no component changes required.

import workflowsData from "@/content/workflows.json";
import pluginsData from "@/content/plugins.json";
import changelogData from "@/content/changelog.json";

export type Status = "available" | "in-development" | "coming-soon";
export type RiskLevel = "low" | "medium" | "high";
export type PluginBadge = "official" | "experimental" | "in-development";

export type Workflow = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  status: Status;
  risk: RiskLevel;
  tools: string[];
  trigger: string;
  steps: string[];
  permissions: string[];
};

export type Plugin = {
  slug: string;
  name: string;
  category: string;
  badge: PluginBadge;
  status: Status;
  description: string;
  permissions: string[];
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  status: "current" | "released";
  notes: string[];
};

export const workflows = workflowsData as Workflow[];
export const plugins = pluginsData as Plugin[];
export const changelog = changelogData as ChangelogEntry[];

export const pluginCategories = [
  "Productivity",
  "Communication",
  "Education",
  "Files",
  "Calendar",
  "Writing",
  "AI Brains",
  "Coming Soon",
];

// Human-readable labels for each status, used by the StatusBadge component.
export const statusLabels: Record<Status, string> = {
  available: "Available now",
  "in-development": "In development",
  "coming-soon": "Coming soon",
};

export const riskLabels: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "Needs confirmation",
};
