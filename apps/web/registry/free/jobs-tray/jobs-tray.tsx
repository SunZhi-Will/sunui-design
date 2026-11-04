"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type JobState = "running" | "done" | "failed";

export interface Job {
  id: string;
  label: ReactNode;
  state: JobState;
  /** 0 到 1；省略時顯示不確定進度 */
  progress?: number;
  detail?: ReactNode;
  error?: ReactNode;
}

export interface JobsTrayLabels {
  region?: string;
  summary?: (total: number, failed: number) => ReactNode;
  retry?: ReactNode;
  dismiss?: string;
  collapse?: string;
  expand?: string;
  done?: ReactNode;
  doneAnnouncement?: (label: string) => string;
  failedAnnouncement?: (label: string) => string;
}

export interface JobsTrayProps {
  jobs: Job[];
  onRetry?: (id: string) => void;
  onDismiss?: (id: string) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 完成的工作在幾毫秒後自動收掉；Infinity 表示保留 */
  doneTimeout?: number;
  /** 預設 fixed 於視窗右下；false 時改為 absolute，交給父層定位 */
  fixed?: boolean;
  labels?: JobsTrayLabels;
  className?: string;
}

const defaultLabels: Required<JobsTrayLabels> = {
  region: "Background tasks",
  summary: (total, failed) => (
    <>
      {total} {total === 1 ? "task" : "tasks"}
      {failed > 0 && <> · {failed} failed</>}
    </>
  ),
  retry: "Retry",
  dismiss: "Dismiss",
  collapse: "Collapse tasks",
  expand: "Expand tasks",
  done: "Done",
  doneAnnouncement: (label) => `${label} finished.`,
  failedAnnouncement: (label) => `${label} failed.`,
};

const ease = [0.23, 1, 0.32, 1] as const;
const springs = { gentle: { type: "spring", stiffness: 240, damping: 30 } } as const;

/** 管理背景工作清單的小工具 */
export function useJobs(initial: Job[] = []) {
  const [jobs, setJobs] = useState<Job[]>(initial);
  const add = useCallback((job: Job) => setJobs((prev) => [...prev.filter((j) => j.id !== job.id), job]), []);
  const update = useCallback(
    (id: string, patch: Partial<Job>) => setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j))),
    [],
  );
  const remove = useCallback((id: string) => setJobs((prev) => prev.filter((j) => j.id !== id)), []);
  return { jobs, add, update, remove, setJobs };
}

const toText = (n: ReactNode) => (typeof n === "string" || typeof n === "number" ? String(n) : "Task");

export function JobsTray({
  jobs,
  onRetry,
  onDismiss,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  doneTimeout = 4000,
  fixed = true,
  labels,
  className,
}: JobsTrayProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const [inner, setInner] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? inner;
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [announce, setAnnounce] = useState("");
  const prevStates = useRef(new Map<string, JobState>());

  // 只在完成或失敗時播報，並排程自動收掉已完成的工作
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const job of jobs) {
      const before = prevStates.current.get(job.id);
      if (before && before !== job.state) {
        if (job.state === "done") setAnnounce(t.doneAnnouncement(toText(job.label)));
        if (job.state === "failed") setAnnounce(t.failedAnnouncement(toText(job.label)));
      }
      if (job.state === "done" && before !== "done" && Number.isFinite(doneTimeout)) {
        timers.push(setTimeout(() => setHidden((s) => new Set(s).add(job.id)), doneTimeout));
      }
      if (job.state !== "done" && hidden.has(job.id)) {
        setHidden((s) => {
          const next = new Set(s);
          next.delete(job.id);
          return next;
        });
      }
    }
    prevStates.current = new Map(jobs.map((j) => [j.id, j.state]));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, doneTimeout]);

  const visible = jobs.filter((j) => !(j.state === "done" && hidden.has(j.id)));
  const failed = visible.filter((j) => j.state === "failed").length;

  const toggle = () => {
    const next = !collapsed;
    if (collapsedProp === undefined) setInner(next);
    onCollapsedChange?.(next);
  };

  return (
    <section
      aria-label={t.region}
      className={cn(
        fixed ? "fixed right-4 bottom-4 z-50" : "absolute right-3 bottom-3 z-10",
        "w-[min(22rem,calc(100%-1.5rem))]",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {visible.length > 0 && (
          <motion.div
            key="tray"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 12, transition: { duration: 0.18, ease } }}
            transition={reduce ? { duration: 0 } : springs.gentle}
            className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
          >
            <button
              type="button"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t.expand : t.collapse}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", failed ? "bg-destructive" : "bg-primary")} aria-hidden="true" />
              <span className="flex-1 font-medium tabular-nums">{t.summary(visible.length, failed)}</span>
              <svg
                viewBox="0 0 16 16"
                className={cn("size-4 text-muted-foreground transition-transform", collapsed && "rotate-180")}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {!collapsed && (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto border-t border-border">
                <AnimatePresence initial={false}>
                  {visible.map((job) => (
                    <motion.li
                      key={job.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0, transition: { duration: 0.18, ease } }}
                      transition={reduce ? { duration: 0 } : springs.gentle}
                      className="px-3 py-2.5"
                    >
                      <JobRow job={job} t={t} onRetry={onRetry} onDismiss={onDismiss} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </section>
  );
}

function JobRow({
  job,
  t,
  onRetry,
  onDismiss,
}: {
  job: Job;
  t: Required<JobsTrayLabels>;
  onRetry?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  const pct = job.progress === undefined ? null : Math.round(Math.min(Math.max(job.progress, 0), 1) * 100);
  const dot = job.state === "failed" ? "bg-destructive" : job.state === "done" ? "bg-emerald-500" : "bg-primary";
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-medium">{job.label}</span>
        {job.state === "running" && pct !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
        )}
        {job.state === "done" && <span className="text-xs text-muted-foreground">{t.done}</span>}
      </div>

      {job.state === "running" && (
        <div
          role="progressbar"
          aria-label={toText(job.label)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct ?? undefined}
          className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full origin-left rounded-full bg-primary transition-transform duration-300", pct === null && "w-1/3")}
            style={pct === null ? undefined : { transform: `scaleX(${pct / 100})` }}
          />
        </div>
      )}

      {job.state === "failed" ? (
        <div className="mt-1 flex items-start gap-3 pl-3.5">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">{job.error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(job.id)}
              className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {t.retry}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(job.id)}
              className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {t.dismiss}
            </button>
          )}
        </div>
      ) : (
        job.detail && <p className="mt-1 truncate pl-3.5 text-xs text-muted-foreground">{job.detail}</p>
      )}
    </div>
  );
}
