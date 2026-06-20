"use client";

import { useState } from "react";
import { Brain, Eye, Hand, Workflow, Network, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type PartKey = "brain" | "eyes" | "hands" | "core" | "reach";

type Part = {
  key: PartKey;
  label: string;
  tag: string;
  icon: LucideIcon;
  color: string; // tailwind text color class
  ring: string; // rgba glow
  anchor: { x: number; y: number };
  title: string;
  body: string;
  future?: boolean;
};

const PARTS: Part[] = [
  {
    key: "brain",
    label: "Head — the brain",
    tag: "Your AI",
    icon: Brain,
    color: "text-accent-cyan",
    ring: "rgba(34,211,238,0.9)",
    anchor: { x: 150, y: 62 },
    title: "The head is the brain — bring your own AI",
    body: "Leda has no AI of its own. You plug in the brain: Claude, ChatGPT, Gemini, or a local model like Llama. Swap it whenever a better one ships — you're never locked in.",
  },
  {
    key: "eyes",
    label: "Eyes — awareness",
    tag: "Context",
    icon: Eye,
    color: "text-accent-sky",
    ring: "rgba(56,189,248,0.9)",
    anchor: { x: 150, y: 92 },
    title: "The eyes give it context",
    body: "With your permission, Leda sees only what it needs — the tools, files and schedule you connect — so its help is actually relevant. Nothing is read silently.",
  },
  {
    key: "hands",
    label: "Hands — the workers",
    tag: "Plugins",
    icon: Hand,
    color: "text-accent-teal",
    ring: "rgba(45,212,191,0.9)",
    anchor: { x: 150, y: 196 },
    title: "The hands are the workers",
    body: "Plugins and agents do the real tasks — drafting, sending, organising, building. Anything important pauses for your confirmation before it happens.",
  },
  {
    key: "core",
    label: "Core — workflows",
    tag: "Workflows",
    icon: Workflow,
    color: "text-accent-blue",
    ring: "rgba(59,130,246,0.9)",
    anchor: { x: 150, y: 168 },
    title: "One prompt becomes a workflow",
    body: "Describe a goal in plain language and Leda drafts a reviewable workflow — a clear set of steps it can run for you, that you can read and edit first.",
  },
  {
    key: "reach",
    label: "Legs — reach",
    tag: "Integrations",
    icon: Network,
    color: "text-accent-violet",
    ring: "rgba(139,92,246,0.9)",
    anchor: { x: 150, y: 320 },
    title: "Reach across your whole stack",
    body: "Today Leda connects to the apps you approve. The vision: it plugs into an entire company and coordinates work across it — as the operating brain, always with humans in the loop.",
    future: true,
  },
];

export function OperatingBrain() {
  const [active, setActive] = useState<PartKey>("brain");
  const part = PARTS.find((p) => p.key === active)!;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Figure */}
      <div className="relative mx-auto w-full max-w-sm">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 35%, rgba(56,189,248,0.28), transparent 70%), radial-gradient(40% 40% at 50% 80%, rgba(139,92,246,0.25), transparent 70%)",
          }}
        />
        <svg
          viewBox="0 0 300 380"
          className="w-full"
          role="img"
          aria-label="A friendly figure: head is your AI brain, hands are the workers, legs are its reach into your tools."
        >
          <defs>
            <linearGradient id="ob-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1b2236" />
              <stop offset="1" stopColor="#0c1020" />
            </linearGradient>
            <linearGradient id="ob-accent" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#2DD4BF" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
            <radialGradient id="ob-core" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#7dd3fc" />
              <stop offset="1" stopColor="#3B82F6" />
            </radialGradient>
          </defs>

          {/* legs */}
          <g stroke="url(#ob-body)" strokeWidth="22" strokeLinecap="round" fill="none">
            <path d="M132 250 L120 330" stroke="#141a2b" />
            <path d="M168 250 L180 330" stroke="#141a2b" />
          </g>
          {/* feet */}
          <ellipse cx="116" cy="338" rx="20" ry="10" fill="#141a2b" />
          <ellipse cx="184" cy="338" rx="20" ry="10" fill="#141a2b" />

          {/* arms */}
          <path
            d="M112 158 C 78 168, 66 196, 70 222"
            stroke="#141a2b"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M188 158 C 222 168, 234 196, 230 222"
            stroke="#141a2b"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />

          {/* torso */}
          <rect x="104" y="146" width="92" height="112" rx="34" fill="url(#ob-body)" stroke="#2a3350" strokeWidth="1.5" />

          {/* hands (workers) */}
          <g>
            <circle cx="70" cy="232" r="16" fill="#141a2b" stroke="#2a3350" strokeWidth="1.5" />
            <HandGlyph x={62} y={224} />
            <circle cx="230" cy="232" r="16" fill="#141a2b" stroke="#2a3350" strokeWidth="1.5" />
            <HandGlyph x={222} y={224} />
          </g>

          {/* core (workflows) */}
          <circle cx="150" cy="196" r="17" fill="url(#ob-core)" opacity="0.9" />
          <circle cx="150" cy="196" r="17" fill="none" stroke="#bae6fd" strokeOpacity="0.5" strokeWidth="1" />
          <path d="M143 196 h14 M150 189 v14" stroke="#06121f" strokeWidth="2" strokeLinecap="round" />

          {/* neck */}
          <rect x="140" y="118" width="20" height="20" rx="6" fill="#141a2b" />

          {/* head */}
          <rect x="96" y="26" width="108" height="98" rx="30" fill="url(#ob-body)" stroke="#2a3350" strokeWidth="1.5" />
          {/* brain chip inside head */}
          <g transform="translate(150 60)">
            <rect x="-26" y="-20" width="52" height="40" rx="12" fill="none" stroke="url(#ob-accent)" strokeWidth="2.5" opacity="0.95" />
            <path d="M-13 -8 h26 M-13 0 h26 M-13 8 h26" stroke="url(#ob-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <circle cx="0" cy="0" r="3.5" fill="#2DD4BF" />
          </g>
          {/* eyes */}
          <circle cx="132" cy="100" r="5" fill="#7dd3fc" />
          <circle cx="168" cy="100" r="5" fill="#7dd3fc" />

          {/* active highlight halo */}
          <g key={active}>
            <circle
              cx={part.anchor.x}
              cy={part.anchor.y}
              r="30"
              fill="none"
              stroke={part.ring}
              strokeWidth="2"
              className="animate-pulse-soft"
              opacity="0.9"
            />
            <circle cx={part.anchor.x} cy={part.anchor.y} r="44" fill={part.ring} opacity="0.08" />
          </g>
        </svg>

        {/* floating tag for the active part */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full border border-white/12 bg-base/80 px-3 py-1 text-xs font-medium text-ink backdrop-blur-md"
          style={{
            top: `${(part.anchor.y / 380) * 100}%`,
            transform: "translate(60px, -50%)",
          }}
        >
          <span className={part.color}>{part.tag}</span>
        </div>
      </div>

      {/* Selector + detail */}
      <div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Parts of the figure">
          {PARTS.map((p) => {
            const isActive = p.key === active;
            return (
              <button
                key={p.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(p.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
                  isActive
                    ? "border-white/15 bg-white/[0.06] text-ink shadow-glow-blue"
                    : "border-white/[0.08] bg-white/[0.02] text-ink-muted hover:border-white/20 hover:text-ink",
                )}
              >
                <p.icon size={15} className={isActive ? p.color : "text-ink-faint"} />
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0B0E18]/70 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15",
                part.color,
              )}
            >
              <part.icon size={20} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">{part.title}</h3>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{part.body}</p>
          {part.future ? (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse-soft" />
              The vision · in development
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Small hand glyph drawn in SVG (cartoon mitten) at a given top-left.
function HandGlyph({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x + 4} ${y + 10} q-2 -8 4 -8 q1 -3 4 0 q1 -3 4 0 q3 0 2 6 q4 1 2 6 q-3 5 -10 4 q-6 -1 -8 -8 z`}
      fill="#2DD4BF"
      opacity="0.85"
    />
  );
}
