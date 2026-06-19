import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/fx/motion";
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
        <ol className="relative space-y-8 pl-8 sm:pl-10">
          {/* gradient timeline rail */}
          <span
            aria-hidden
            className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-accent-cyan/70 via-accent-violet/40 to-transparent sm:left-[7px]"
          />
          {changelog.map((entry) => {
            const isCurrent = entry.status === "current";
            return (
              <li key={entry.version} className="relative">
                {/* node */}
                <span
                  className={`absolute -left-[31px] top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full border sm:-left-[39px] ${
                    isCurrent
                      ? "border-accent-teal/50 bg-base shadow-glow-teal"
                      : "border-white/[0.14] bg-surface"
                  }`}
                  aria-hidden
                >
                  <span
                    className={`h-[6px] w-[6px] rounded-full ${
                      isCurrent
                        ? "bg-accent-teal animate-pulse-soft"
                        : "bg-ink-faint"
                    }`}
                  />
                </span>

                <Reveal y={18}>
                  <Card
                    className={
                      isCurrent
                        ? "relative overflow-hidden border-accent-teal/20 bg-gradient-to-br from-accent-teal/[0.06] to-transparent shadow-glow-teal"
                        : "transition-colors hover:border-white/15"
                    }
                  >
                    {isCurrent ? (
                      <div
                        aria-hidden
                        className="absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-50 blur-3xl"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(45,212,191,0.32), transparent 70%)",
                        }}
                      />
                    ) : null}

                    <div className="relative flex flex-wrap items-center gap-3">
                      <h2 className="font-mono text-lg font-semibold text-ink">
                        {entry.version}
                      </h2>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-2.5 py-0.5 text-xs font-medium text-accent-teal">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse-soft" />
                          Latest
                        </span>
                      ) : null}
                      <span className="font-mono text-xs text-ink-faint">
                        {formatDate(entry.date)}
                      </span>
                    </div>

                    <p className="relative mt-1.5 font-display text-base font-medium text-ink">
                      {entry.title}
                    </p>

                    <ul className="relative mt-4 space-y-2.5">
                      {entry.notes.map((note, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-ink-muted"
                        >
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              isCurrent ? "bg-accent-teal" : "bg-accent-cyan/50"
                            }`}
                          />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </Section>
    </>
  );
}
