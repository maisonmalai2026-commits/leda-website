import type { Metadata } from "next";
import { Users } from "lucide-react";

import { listCreators } from "@/lib/marketplace/data";
import { CreatorCard } from "@/components/marketplace/CreatorCard";
import { EmptyState } from "@/components/marketplace/ui/EmptyState";
import { SectionHeading } from "@/components/ui/Card";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/motion";
import { SpotlightCard } from "@/components/fx/SpotlightCard";

// ---------------------------------------------------------------------------
// /marketplace/creators — public directory of creator profiles. Server
// component. Reads listCreators() (public profiles + read-only aggregates) and
// renders a responsive grid of CreatorCard, with an EmptyState fallback.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Creators — Leda Marketplace",
  description:
    "Discover the people building and sharing automation workflows and plugins on the Leda Marketplace.",
  alternates: { canonical: "/marketplace/creators" },
  openGraph: {
    title: "Creators — Leda Marketplace",
    description:
      "Discover the people building and sharing automation workflows and plugins on the Leda Marketplace.",
    url: "/marketplace/creators",
    type: "website",
  },
};

export default async function CreatorsDirectoryPage() {
  const creators = await listCreators();

  return (
    <div className="flex flex-col gap-10">
      <Reveal>
        <SectionHeading
          eyebrow="Community"
          title="Creators"
          description="Builders sharing workflows and plugins on the Leda Marketplace. Follow the people whose automations you trust."
        />
      </Reveal>

      {creators.length === 0 ? (
        <Reveal delay={0.1}>
          <EmptyState
            icon={Users}
            title="No creators yet"
            description="Public creator profiles will appear here as people publish workflows and plugins."
          />
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <StaggerItem key={creator.id} className="flex">
              <SpotlightCard className="h-full w-full rounded-2xl">
                <CreatorCard creator={creator} />
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
