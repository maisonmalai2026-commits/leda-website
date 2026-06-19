"use client";

import { useState, type ReactNode } from "react";

import { Tabs } from "@/components/marketplace/ui/Tabs";
import { Reveal } from "@/components/fx/motion";

// ---------------------------------------------------------------------------
// ProfileTabs — thin client wrapper that owns the active-tab state for the
// creator profile page. The actual content (workflow cards / plugin cards) is
// rendered on the server and passed in as ReactNode props, so no marketplace
// data or server-only code crosses the client boundary here.
// ---------------------------------------------------------------------------

type TabId = "workflows" | "plugins";

export function ProfileTabs({
  workflowCount,
  pluginCount,
  workflows,
  plugins,
}: {
  workflowCount: number;
  pluginCount: number;
  workflows: ReactNode;
  plugins: ReactNode;
}) {
  const [active, setActive] = useState<TabId>("workflows");

  const tabs = [
    { id: "workflows", label: `Workflows (${workflowCount})` },
    { id: "plugins", label: `Plugins (${pluginCount})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        tabs={tabs}
        active={active}
        onChange={(id) => setActive(id as TabId)}
        aria-label="Creator content"
      />

      <div
        role="tabpanel"
        aria-label={active === "workflows" ? "Workflows" : "Plugins"}
        tabIndex={0}
        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70"
      >
        <Reveal key={active} y={14}>
          {active === "workflows" ? workflows : plugins}
        </Reveal>
      </div>
    </div>
  );
}
