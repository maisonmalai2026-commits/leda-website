"use client";

import { useId, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  FileJson,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/marketplace/ui/Toast";
import { useDemoIdentity } from "@/components/marketplace/useDemoIdentity";
import { WorkflowGraphView } from "@/components/marketplace/WorkflowGraphView";
import { submitWorkflowDraft } from "@/lib/marketplace/actions";
import { validateWorkflowGraph } from "@/lib/marketplace/validation/workflow";
import {
  RISK_LEVEL,
  VISIBILITY,
  type RiskLevel,
  type ValidationIssue,
  type ValidationResult,
  type Visibility,
  type WorkflowGraph,
} from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// WorkflowWizard — client-side multi-step submission wizard.
//
// All validation runs through the shared validateWorkflowGraph (client-safe,
// pure) for instant inline feedback, and the FINAL submit calls the
// submitWorkflowDraft server action (which re-validates + enforces the creator
// role + rate limits). Nothing here executes a workflow — it only parses JSON
// structure and renders a read-only preview.
// ---------------------------------------------------------------------------

interface StepDef {
  id: number;
  title: string;
  short: string;
}

const STEPS: StepDef[] = [
  { id: 1, title: "Basic info", short: "Basics" },
  { id: 2, title: "Workflow JSON", short: "JSON" },
  { id: 3, title: "Validate", short: "Validate" },
  { id: 4, title: "Required plugins & permissions", short: "Plugins" },
  { id: 5, title: "Risk level", short: "Risk" },
  { id: 6, title: "Screenshots & preview", short: "Media" },
  { id: 7, title: "Visibility", short: "Visibility" },
  { id: 8, title: "Submit for review", short: "Submit" },
];

const GUEST_TOAST = "Sign in (demo) to do that";

// A valid sample graph the "Load example" button inserts. It includes a
// sensitive (call_native_plugin) action plus the required ask_confirmation and
// verify_result nodes so it passes the safety validator out of the box.
const EXAMPLE_GRAPH: WorkflowGraph = {
  nodes: [
    { id: "trigger", type: "manual_trigger", label: "Start manually" },
    { id: "brain", type: "main_brain", label: "Plan the steps" },
    {
      id: "confirm",
      type: "ask_confirmation",
      label: "Ask before sending",
    },
    {
      id: "send",
      type: "call_native_plugin",
      label: "Send the email",
      config: { plugin: "email", action: "send" },
    },
    { id: "verify", type: "verify_result", label: "Verify it sent" },
    { id: "notify", type: "notify_user", label: "Tell the user" },
    { id: "done", type: "end", label: "Done" },
  ],
  edges: [
    { id: "e1", source: "trigger", target: "brain" },
    { id: "e2", source: "brain", target: "confirm" },
    { id: "e3", source: "confirm", target: "send", condition: "approved" },
    { id: "e4", source: "send", target: "verify" },
    { id: "e5", source: "verify", target: "notify" },
    { id: "e6", source: "notify", target: "done" },
  ],
};

const RISK_COPY: Record<RiskLevel, string> = {
  low: "Read-only or fully reversible. No outbound messages or irreversible changes.",
  medium:
    "Sends messages or changes data, but only after explicit confirmation steps.",
  high: "Performs sensitive or hard-to-undo actions. Requires extra review.",
};

const VISIBILITY_COPY: Record<Visibility, string> = {
  public: "Listed publicly in the marketplace once a reviewer approves it.",
  unlisted: "Reachable by direct link but not shown in galleries.",
  private: "Only visible to you. Useful for drafts you're not ready to share.",
};

function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return (
    <ul role="list" className="flex flex-col gap-2">
      {[...errors, ...warnings].map((issue, i) => {
        const isError = issue.severity === "error";
        return (
          <li
            key={`${issue.code}-${issue.path ?? i}`}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] leading-relaxed",
              isError
                ? "border-rose-400/25 bg-rose-400/[0.07] text-rose-200"
                : "border-amber-400/25 bg-amber-400/[0.07] text-amber-200",
            )}
          >
            {isError ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <span className="min-w-0">
              <span className="font-medium">{issue.message}</span>
              {issue.path ? (
                <span className="ml-1 break-all font-mono text-[11px] text-ink-faint">
                  ({issue.path})
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function field(
  label: string,
  id: string,
  children: React.ReactNode,
  hint?: string,
) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12px] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-shadow duration-200 focus:border-accent-sky/50 focus:outline-none focus:ring-2 focus:ring-accent-sky/40 focus:shadow-glow-blue";

export function WorkflowWizard() {
  const { toast } = useToast();
  const { isSignedIn } = useDemoIdentity();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(1);

  // Step 1 — basics
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  // Step 2 — JSON
  const [jsonText, setJsonText] = useState("");

  // Step 3 — validation (computed)
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Step 4 — required plugins + permissions (comma-separated, metadata only)
  const [requiredPlugins, setRequiredPlugins] = useState("");
  const [permissions, setPermissions] = useState("");

  // Step 5 — risk
  const [risk, setRisk] = useState<RiskLevel>("low");

  // Step 6 — screenshots (urls, optional, metadata only)
  const [screenshots, setScreenshots] = useState("");

  // Step 7 — visibility
  const [visibility, setVisibility] = useState<Visibility>("public");

  const titleId = useId();
  const shortId = useId();
  const longId = useId();
  const jsonId = useId();
  const pluginsId = useId();
  const permsId = useId();
  const screenshotsId = useId();

  // Parse the JSON into a graph for the preview (null when not yet valid).
  const parsedGraph = useMemo<WorkflowGraph | null>(() => {
    if (!validation?.ok) return null;
    try {
      const obj = JSON.parse(jsonText);
      if (obj && Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
        return obj as WorkflowGraph;
      }
    } catch {
      // ignore — preview only renders for valid graphs
    }
    return null;
  }, [validation, jsonText]);

  function runValidation(): ValidationResult {
    const result = validateWorkflowGraph(jsonText);
    setValidation(result);
    return result;
  }

  function loadExample() {
    setJsonText(JSON.stringify(EXAMPLE_GRAPH, null, 2));
    setValidation(null);
    toast({
      title: "Example loaded",
      description: "A valid sample graph was inserted. Validate it next.",
      variant: "info",
    });
  }

  function csvToArray(value: string): string[] {
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function goNext() {
    // Lightweight per-step gating so users don't reach submit with nothing.
    if (step === 1 && title.trim().length === 0) {
      toast({
        title: "Add a title",
        description: "Give your workflow a name before continuing.",
        variant: "info",
      });
      return;
    }
    if (step === 2 && jsonText.trim().length === 0) {
      toast({
        title: "Add your workflow JSON",
        description: "Paste a graph or load the example to continue.",
        variant: "info",
      });
      return;
    }
    if (step === 2) {
      // Auto-validate when leaving the JSON step so step 3 has a result.
      runValidation();
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    if (!isSignedIn) {
      toast({ title: GUEST_TOAST, variant: "info" });
      return;
    }
    // Re-validate client-side first so we never submit a graph we know is bad.
    const result = runValidation();
    if (!result.ok) {
      setStep(3);
      toast({
        title: "Fix the issues before submitting",
        description: "The workflow JSON did not pass safety validation.",
        variant: "error",
      });
      return;
    }

    startTransition(async () => {
      const res = await submitWorkflowDraft({
        title: title.trim(),
        short_description: shortDescription.trim(),
        long_description: longDescription.trim(),
        workflow_json: jsonText,
        required_plugins: csvToArray(requiredPlugins),
        declared_permissions: csvToArray(permissions),
        risk_level: risk,
        screenshots: csvToArray(screenshots),
        visibility,
      });

      if (res.data?.validation) setValidation(res.data.validation);

      if (!res.ok) {
        if (res.data?.validation && !res.data.validation.ok) setStep(3);
        toast({
          title: res.message ?? "Could not submit your draft",
          description: res.issues?.[0]?.message ?? res.error ?? undefined,
          variant: "error",
        });
        return;
      }

      toast({
        title: res.message ?? "Draft submitted",
        description: res.demo ? "Demo mode — not persisted." : undefined,
        variant: "success",
      });
    });
  }

  const current = STEPS[step - 1];
  const validateState: "idle" | "ok" | "error" = !validation
    ? "idle"
    : validation.ok
      ? "ok"
      : "error";

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <nav aria-label="Submission steps" className="flex flex-col gap-3">
        {/* Progress bar */}
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent-gradient shadow-glow-blue transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <ol
          role="list"
          className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px]"
        >
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                    isActive
                      ? "border-accent-sky/40 bg-accent-sky/10 text-accent-sky"
                      : isDone
                        ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200/90 hover:bg-emerald-400/15"
                        : "border-white/10 bg-white/[0.03] text-ink-muted hover:bg-white/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] tabular-nums",
                      isActive
                        ? "bg-accent-sky/20"
                        : isDone
                          ? "bg-emerald-400/20"
                          : "bg-white/[0.06]",
                    )}
                  >
                    {isDone ? (
                      <Check className="h-2.5 w-2.5" aria-hidden />
                    ) : (
                      s.id
                    )}
                  </span>
                  <span className="hidden sm:inline">{s.short}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 font-display text-sm font-semibold tabular-nums text-accent-cyan"
          >
            {step}
          </span>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-accent-teal">
              Step {step} of {STEPS.length}
            </p>
            <h2 className="mt-0.5 font-display text-xl font-semibold text-ink">
              {current.title}
            </h2>
          </div>
        </div>

        {/* Step 1 — basic info */}
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            {field(
              "Title",
              titleId,
              <input
                id={titleId}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                maxLength={120}
                placeholder="e.g. Summarize my unread email each morning"
                className={inputClass}
              />,
              "A short, descriptive name. Used to generate the slug.",
            )}
            {field(
              "Short description",
              shortId,
              <input
                id={shortId}
                value={shortDescription}
                onChange={(e) =>
                  setShortDescription(e.target.value.slice(0, 160))
                }
                maxLength={160}
                placeholder="One sentence that explains what it does."
                className={inputClass}
              />,
            )}
            {field(
              "Long description",
              longId,
              <textarea
                id={longId}
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                rows={5}
                placeholder="Explain how it works, what it needs, and anything to watch out for."
                className={cn(inputClass, "resize-y")}
              />,
            )}
          </div>
        ) : null}

        {/* Step 2 — JSON import */}
        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-muted">
                Paste your declarative workflow graph as JSON (nodes + edges).
              </p>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={loadExample}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Load example
              </Button>
            </div>
            {field(
              "Workflow JSON",
              jsonId,
              <textarea
                id={jsonId}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setValidation(null);
                }}
                rows={16}
                spellCheck={false}
                placeholder='{ "nodes": [...], "edges": [...] }'
                className={cn(
                  inputClass,
                  "resize-y font-mono text-[12.5px] leading-relaxed",
                )}
                aria-describedby={`${jsonId}-hint`}
              />,
            )}
            <p id={`${jsonId}-hint`} className="text-[12px] text-ink-faint">
              Only declarative structure is accepted — no code, scripts, or
              secrets. It is validated, never executed.
            </p>
          </div>
        ) : null}

        {/* Step 3 — validate */}
        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="primary" onClick={runValidation}>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Validate workflow
              </Button>
              {validateState === "ok" ? (
                <Pill className="border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Passed safety validation
                </Pill>
              ) : null}
              {validateState === "error" ? (
                <Pill className="border-rose-400/25 bg-rose-400/10 text-rose-300">
                  <CircleAlert className="h-3.5 w-3.5" aria-hidden />
                  {validation!.issues.filter((i) => i.severity === "error")
                    .length}{" "}
                  error(s)
                </Pill>
              ) : null}
            </div>

            {validateState === "idle" ? (
              <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-ink-muted">
                Run validation to check your graph against every safety rule:
                allowed node types, a trigger and an end node, no cycles or
                hidden steps, and confirmation + verification around any
                sensitive action.
              </p>
            ) : null}

            {validation && validation.issues.length > 0 ? (
              <IssueList issues={validation.issues} />
            ) : null}

            {validateState === "ok" && parsedGraph ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink-muted">Preview</p>
                <div className="relative overflow-hidden rounded-2xl border border-accent-teal/20 bg-accent-teal/[0.03] p-1 shadow-glow-teal">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-teal/15 blur-3xl"
                  />
                  <div className="relative">
                    <WorkflowGraphView graph={parsedGraph} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 4 — required plugins & permissions */}
        {step === 4 ? (
          <div className="flex flex-col gap-4">
            {field(
              "Required plugins",
              pluginsId,
              <textarea
                id={pluginsId}
                value={requiredPlugins}
                onChange={(e) => setRequiredPlugins(e.target.value)}
                rows={3}
                placeholder="email, calendar, browser"
                className={cn(inputClass, "resize-y")}
              />,
              "Comma or newline separated. List the plugins this workflow needs.",
            )}
            {field(
              "Declared permissions",
              permsId,
              <textarea
                id={permsId}
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                rows={3}
                placeholder="read:email, send:email"
                className={cn(inputClass, "resize-y")}
              />,
              "Be honest and specific. Reviewers compare these against the graph.",
            )}
          </div>
        ) : null}

        {/* Step 5 — risk level */}
        {step === 5 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink-muted">
              How risky is this workflow?
            </legend>
            {RISK_LEVEL.map((level) => (
              <label
                key={level}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  risk === level
                    ? "border-accent-sky/40 bg-accent-sky/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <input
                  type="radio"
                  name="risk"
                  value={level}
                  checked={risk === level}
                  onChange={() => setRisk(level)}
                  className="mt-1 h-4 w-4 accent-accent-sky"
                />
                <span>
                  <span className="block text-sm font-medium capitalize text-ink">
                    {level} risk
                  </span>
                  <span className="block text-[13px] leading-relaxed text-ink-muted">
                    {RISK_COPY[level]}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {/* Step 6 — screenshots / preview */}
        {step === 6 ? (
          <div className="flex flex-col gap-4">
            {field(
              "Screenshot URLs",
              screenshotsId,
              <textarea
                id={screenshotsId}
                value={screenshots}
                onChange={(e) => setScreenshots(e.target.value)}
                rows={3}
                placeholder="https://example.com/preview-1.png"
                className={cn(inputClass, "resize-y")}
              />,
              "Optional. Link to images only — no file uploads. One per line.",
            )}
            {parsedGraph ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink-muted">
                  Graph preview
                </p>
                <div className="relative overflow-hidden rounded-2xl border border-accent-teal/20 bg-accent-teal/[0.03] p-1 shadow-glow-teal">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent-teal/15 blur-3xl"
                  />
                  <div className="relative">
                    <WorkflowGraphView graph={parsedGraph} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-ink-muted">
                Validate a graph on step 3 to see a live preview here.
              </p>
            )}
          </div>
        ) : null}

        {/* Step 7 — visibility */}
        {step === 7 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink-muted">
              Who can see this once approved?
            </legend>
            {VISIBILITY.map((v) => (
              <label
                key={v}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  visibility === v
                    ? "border-accent-sky/40 bg-accent-sky/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  className="mt-1 h-4 w-4 accent-accent-sky"
                />
                <span>
                  <span className="block text-sm font-medium capitalize text-ink">
                    {v}
                  </span>
                  <span className="block text-[13px] leading-relaxed text-ink-muted">
                    {VISIBILITY_COPY[v]}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {/* Step 8 — submit for review */}
        {step === 8 ? (
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-violet/10 blur-3xl"
              />
              <h3 className="relative text-sm font-semibold text-ink">
                Review summary
              </h3>
              <dl className="relative mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Title</dt>
                  <dd className="truncate text-ink">{title || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Risk</dt>
                  <dd className="capitalize text-ink">{risk}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Visibility</dt>
                  <dd className="capitalize text-ink">{visibility}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Validation</dt>
                  <dd
                    className={cn(
                      "font-medium",
                      validateState === "ok"
                        ? "text-emerald-300"
                        : validateState === "error"
                          ? "text-rose-300"
                          : "text-ink-muted",
                    )}
                  >
                    {validateState === "ok"
                      ? "Passed"
                      : validateState === "error"
                        ? "Has errors"
                        : "Not run"}
                  </dd>
                </div>
              </dl>
            </div>

            {validateState === "error" ? (
              <IssueList issues={validation!.issues} />
            ) : null}

            <div className="rounded-xl border border-accent-sky/20 bg-accent-sky/[0.05] px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
              Submitting sends your draft for human review. Nothing is published
              automatically and nothing runs on your machine. A reviewer
              approves it before it appears publicly.
            </div>

            <div>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={pending || !isSignedIn}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                {pending ? "Submitting…" : "Submit for review"}
              </Button>
              {!isSignedIn ? (
                <p className="mt-2 text-[12px] text-ink-faint">
                  Switch your demo identity to a creator from the account menu
                  to submit.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          {step < STEPS.length ? (
            <Button type="button" variant="secondary" onClick={goNext}>
              Next
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <span aria-hidden className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint">
              <FileJson className="h-3.5 w-3.5" />
              Final step
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
