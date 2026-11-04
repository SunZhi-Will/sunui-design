"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type JobState = "queued" | "running" | "failed" | "done";

export interface JobStatus {
  state: JobState;
  /** 目前步驟（0 起算）；等於步驟總數表示收尾中 */
  step?: number;
  /** 排在前面的工作數 */
  queuePosition?: number;
  eta?: ReactNode;
  /** 為什麼比較慢，例如走了較慢的處理路徑 */
  reason?: ReactNode;
  error?: ReactNode;
}

export interface JobProgressLabels {
  title?: ReactNode;
  ahead?: (n: number) => ReactNode;
  starting?: ReactNode;
  finishing?: ReactNode;
  failed?: ReactNode;
  ready?: ReactNode;
  eta?: (eta: ReactNode) => ReactNode;
  leaveNote?: ReactNode;
  cancel?: ReactNode;
  retry?: ReactNode;
  stamp?: ReactNode;
  states?: Record<JobState, string>;
  announce?: (state: JobState, step?: string) => string;
}

export interface JobProgressProps {
  steps: { id: string; label: ReactNode }[];
  status: JobStatus;
  jobId?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  result?: { label: ReactNode; href?: string; onClick?: () => void };
  /** 單行列表樣式 */
  compact?: boolean;
  labels?: JobProgressLabels;
  className?: string;
}

const defaultLabels: Required<JobProgressLabels> = {
  title: "Work order",
  ahead: (n) => (n === 1 ? "1 order ahead of yours" : `${n} orders ahead of yours`),
  starting: "Starting",
  finishing: "Finishing up",
  failed: "Something went wrong. Nothing was charged for this step.",
  ready: "Ready",
  eta: (eta) => <>About {eta} left</>,
  leaveNote: "You can leave this page; we'll email you.",
  cancel: "Cancel",
  retry: "Try again",
  stamp: "Done",
  states: { queued: "Queued", running: "In progress", failed: "Failed", done: "Done" },
  announce: (state, step) => (state === "running" && step ? `Now: ${step}` : state),
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

/** 非線性進度：排隊 2%、各步驟落在 15 到 95、收尾 97、完成 100 */
export function jobPercent(status: JobStatus, totalSteps: number) {
  if (status.state === "done") return 100;
  if (status.state === "queued") return 2;
  const step = status.step ?? 0;
  if (step >= totalSteps) return 97;
  return Math.round(15 + (80 * step) / Math.max(totalSteps, 1));
}

export function JobProgress({ steps, status, jobId, onCancel, onRetry, result, compact = false, labels, className }: JobProgressProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const total = steps.length;
  const percent = jobPercent(status, total);
  const step = status.state === "done" ? total : status.state === "queued" ? -1 : (status.step ?? 0);
  const current = steps[step];

  // 只在狀態或步驟改變時播報，不逐秒播報百分比
  const [announcement, setAnnouncement] = useState("");
  const first = useRef(true);
  const currentText = typeof current?.label === "string" ? current.label : undefined;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setAnnouncement(t.announce(status.state, currentText));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.state, step]);

  const line =
    status.state === "queued"
      ? status.queuePosition
        ? t.ahead(status.queuePosition)
        : t.starting
      : status.state === "failed"
        ? (status.error ?? t.failed)
        : status.state === "done"
          ? t.ready
          : step >= total
            ? t.finishing
            : current?.label;

  const bar = (
    <span aria-hidden="true" className="relative block h-[3px] w-full overflow-hidden rounded-full bg-[#e7e0d0] dark:bg-[#38332b]">
      <motion.span
        className={cn("absolute inset-y-0 left-0 w-full origin-left bg-current", status.state === "failed" && "opacity-40")}
        initial={false}
        animate={{ scaleX: percent / 100 }}
        transition={reduce ? { duration: 0 } : springs.gentle}
      />
    </span>
  );

  const live = (
    <span className="sr-only" role="status" aria-live="polite">
      {announcement}
    </span>
  );

  const action =
    status.state === "failed" && onRetry ? (
      <button type="button" onClick={onRetry} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
        {t.retry}
      </button>
    ) : (status.state === "queued" || status.state === "running") && onCancel ? (
      <button type="button" onClick={onCancel} className={cn("text-sm underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none", inkMuted)}>
        {t.cancel}
      </button>
    ) : status.state === "done" && result ? (
      result.href ? (
        <a href={result.href} onClick={result.onClick} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          {result.label}
        </a>
      ) : (
        <button type="button" onClick={result.onClick} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          {result.label}
        </button>
      )
    ) : null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 py-2.5 text-sm", ink, className)}>
        <StateDot state={status.state} />
        <span className="w-20 shrink-0 text-xs font-medium">{t.states[status.state]}</span>
        <span className="min-w-0 flex-1 truncate">
          {jobId && <span className="mr-2 font-mono text-xs tracking-[0.12em]">{jobId}</span>}
          <span className={inkMuted}>{line}</span>
        </span>
        <span className="hidden w-20 shrink-0 sm:block">{bar}</span>
        <span className="w-9 shrink-0 text-right text-xs tabular-nums">{percent}%</span>
        {action && <span className="shrink-0 [&_*]:text-xs">{action}</span>}
        {live}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full max-w-md rounded-md border p-4", paper, edge, ink, className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>
          {t.title}
          {jobId && <span className="ml-2 font-mono tracking-[0.12em] normal-case">{jobId}</span>}
        </p>
        <span className="text-sm font-semibold tabular-nums">{percent}%</span>
      </div>

      <div className="mt-3">{bar}</div>

      <p className={cn("mt-3 text-sm font-medium", status.state === "failed" && "text-destructive")}>{line}</p>
      {status.state === "running" && status.eta && <p className={cn("mt-0.5 text-xs tabular-nums", inkMuted)}>{t.eta(status.eta)}</p>}
      {status.reason && status.state !== "done" && <p className={cn("mt-0.5 text-xs", inkMuted)}>{status.reason}</p>}

      <ol className={cn("mt-3 space-y-1.5 border-t border-dashed pt-3 text-sm", edge)}>
        {steps.map((s, i) => {
          const st = i < step ? "done" : i === step ? (status.state === "failed" ? "failed" : "active") : "pending";
          return (
            <li key={s.id} aria-current={st === "active" ? "step" : undefined} className={cn("flex items-center gap-2.5", st === "pending" && inkMuted)}>
              <StepIcon state={st} />
              <span className={cn(st === "active" && "font-medium", st === "failed" && "text-destructive")}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      {(action || status.state === "queued" || status.state === "running") && (
        <div className={cn("mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-3", edge)}>
          {(status.state === "queued" || status.state === "running") && <p className={cn("text-xs", inkMuted)}>{t.leaveNote}</p>}
          {action && <span className="ml-auto">{action}</span>}
        </div>
      )}

      <AnimatePresence initial={false}>
        {status.state === "done" && (
          <motion.span
            key="stamp"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-[4.25rem] right-4 rounded-[3px] border-2 border-current px-2 py-0.5 text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              vermilion,
            )}
            initial={reduce ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
            transition={springs.stamp}
          >
            {t.stamp}
          </motion.span>
        )}
      </AnimatePresence>
      {live}
    </div>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "failed" | "pending" }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {state === "done" && <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />}
      {state === "active" && <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />}
      {state === "failed" && <path d="m4.5 4.5 7 7m0-7-7 7" strokeLinecap="round" className="text-destructive" />}
      {state === "pending" && <circle cx="8" cy="8" r="3.25" />}
    </svg>
  );
}

/** 顏色只放在點上 */
function StateDot({ state }: { state: JobState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        state === "running" && "bg-current",
        state === "queued" && "border border-current",
        state === "failed" && "bg-destructive",
        state === "done" && "bg-emerald-700 dark:bg-emerald-400",
      )}
    />
  );
}
