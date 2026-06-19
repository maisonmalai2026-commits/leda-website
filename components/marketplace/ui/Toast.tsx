"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  Bell,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastVariant = "default" | "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Defaults to 5000. */
  durationMs?: number;
}

interface ToastRecord extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 5000;

const variantStyles: Record<
  ToastVariant,
  { box: string; iconWrap: string; Icon: LucideIcon }
> = {
  default: {
    box: "border-white/[0.10] bg-surface-raised",
    iconWrap: "text-ink-muted",
    Icon: Bell,
  },
  success: {
    box: "border-emerald-400/25 bg-surface-raised",
    iconWrap: "text-emerald-300",
    Icon: CheckCircle2,
  },
  error: {
    box: "border-rose-400/25 bg-surface-raised",
    iconWrap: "text-rose-300",
    Icon: XCircle,
  },
  info: {
    box: "border-accent-sky/25 bg-surface-raised",
    iconWrap: "text-accent-sky",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default", durationMs }: ToastOptions) => {
      const id = ++idRef.current;
      const duration = durationMs ?? DEFAULT_DURATION;
      setToasts((prev) => {
        const next = [...prev, { id, title, description, variant, durationMs: duration }];
        // Cap the stack: drop the oldest beyond MAX_TOASTS.
        return next.slice(-MAX_TOASTS);
      });
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((t) => {
        const s = variantStyles[t.variant];
        const Icon = s.Icon;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-xl border p-3.5 shadow-card animate-fade-up",
              s.box,
            )}
            // Allow keyboard dismissal when focused (Esc / Enter).
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter") {
                e.preventDefault();
                onDismiss(t.id);
              }
            }}
          >
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 shrink-0", s.iconWrap)}>
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
                    {t.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss notification"
                className={cn(
                  "-mr-1 -mt-1 shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/70",
                )}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
