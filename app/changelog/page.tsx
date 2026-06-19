import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/PageHeader";
import { changelog } from "@/lib/content";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "A running log of Leda's progress — from the first desktop prototype to brain profiles, the workflow builder, and the public website.",
};

function formatDate(iso: string) {
  // Deterministic formatting (avoids locale drift between server and client).
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="How Leda has been shaping up."
        description="Each release moves Leda a little closer to a trustworthy operating layer. New entries are added to a simple content file."
      />

      <Section>
        <ol className="relative space-y-10 border-l border-white/[0.08] pl-8 sm:pl-10">
          {changelog.map((entry) => (
            <li key={entry.version} className="relative">
              {/* node */}
              <span
                className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.12] bg-surface sm:-left-[49px]"
                aria-hidden
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    entry.status === "current"
                      ? "bg-accent-teal"
                      : "bg-ink-faint"
                  }`}
                />
              </span>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-lg font-semibold text-ink">
                  {entry.version}
                </h2>
                {entry.status === "current" ? (
                  <span className="inline-flex items-center rounded-full border border-accent-teal/30 bg-accent-teal/10 px-2.5 py-0.5 text-xs font-medium text-accent-teal">
                    Latest
                  </span>
                ) : null}
                <span className="text-xs text-ink-faint">{formatDate(entry.date)}</span>
              </div>

              <p className="mt-1 text-base font-medium text-ink">{entry.title}</p>

              <ul className="mt-4 space-y-2.5">
                {entry.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-teal/60" />
                    {note}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
