"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/* AutoLens 的深色 token，元件自帶，不依賴網站主題 */
const tokens = {
  "--al-bg-elevated": "#252525",
  "--al-border": "rgba(255, 255, 255, 0.06)",
  "--al-text-primary": "#e5e5e5",
  "--al-text-secondary": "#a3a3a3",
  "--al-text-muted": "#8a8a8a",
  "--al-danger": "#dc2626",
} as CSSProperties;

export type BackgroundJobState = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface BackgroundJob {
  id: string;
  /** 只用來判斷要不要顯示，例如 hash 這類內部工作只有失敗才顯示 */
  type?: string;
  /** 給使用者看的名稱，例如「Saving camera track」 */
  label: string;
  state: BackgroundJobState;
  /** 0 到 1；未知進度時為 undefined */
  progress?: number;
  errorCode?: string;
  startedAt: number;
  endedAt?: number;
  /** 可取消的工作在面板上多一顆 ✕ */
  onCancel?: () => void;
}

/** 跑不到這麼久就完成的工作不值得事後再跳一則「完成」出來 */
const QUICK_JOB_MS = 1500;
/** 已完成的工作保留多久才從清單移除 */
const COMPLETED_TTL_MS = 8000;

/**
 * 這個工作該不該出現在面板上：失敗與取消一律顯示；hash 只有失敗才顯示；
 * 一下子就完成的工作不補一則「完成」。
 */
export function isJobWorthShowing(job: BackgroundJob): boolean {
  if (job.state === "failed" || job.state === "cancelled") return true;
  if (job.type === "hash") return false;
  if (job.state === "completed") return (job.endedAt ?? job.startedAt) - job.startedAt >= QUICK_JOB_MS;
  return true;
}

/** 背景工作登記簿：startJob、updateJob、finishJob、dismissJob、runJob，行為同原本的 service */
export function useBackgroundJobs(options?: { completedTtl?: number }) {
  const ttl = options?.completedTtl ?? COMPLETED_TTL_MS;
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  const startJob = useCallback((type: string, label: string, opts?: { onCancel?: () => void }) => {
    seq.current += 1;
    const id = `${type}-${seq.current}`;
    const job: BackgroundJob = { id, type, label, state: "running", startedAt: Date.now(), ...(opts?.onCancel ? { onCancel: opts.onCancel } : {}) };
    setJobs((prev) => [...prev, job]);
    return id;
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<Pick<BackgroundJob, "progress" | "label">>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const dismissJob = useCallback((id: string) => setJobs((prev) => prev.filter((j) => j.id !== id)), []);

  const finishJob = useCallback(
    (id: string, result: { success: boolean; errorCode?: string } = { success: true }) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? { ...j, state: result.success ? "completed" : "failed", ...(result.errorCode ? { errorCode: result.errorCode } : {}), endedAt: Date.now() }
            : j,
        ),
      );
      // 成功的工作自動淡出；失敗的留著，讓使用者看到
      if (result.success) {
        const timer = setTimeout(() => {
          timers.current.delete(timer);
          dismissJob(id);
        }, ttl);
        timers.current.add(timer);
      }
    },
    [dismissJob, ttl],
  );

  const cancelJob = useCallback((id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, state: "cancelled", endedAt: Date.now(), onCancel: undefined } : j)));
  }, []);

  /** 包住一段背景工作：自動登記、成功或失敗收尾 */
  const runJob = useCallback(
    async <T,>(type: string, label: string, fn: (report: (progress: number) => void) => Promise<T>) => {
      const id = startJob(type, label);
      try {
        const out = await fn((progress) => updateJob(id, { progress }));
        finishJob(id, { success: true });
        return out;
      } catch (err) {
        finishJob(id, { success: false, errorCode: err instanceof Error ? err.message : String(err) });
        throw err;
      }
    },
    [finishJob, startJob, updateJob],
  );

  return { jobs, startJob, updateJob, finishJob, dismissJob, cancelJob, runJob };
}

export interface JobsTrayLabels {
  region?: string;
  running?: string;
  completed?: string;
  failed?: string;
  cancelled?: string;
  queued?: string;
  dismiss?: string;
  cancel?: string;
}

const defaultLabels: Required<JobsTrayLabels> = {
  region: "Background jobs",
  running: "In progress",
  completed: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
  queued: "Queued",
  dismiss: "Dismiss",
  cancel: "Cancel this job",
};

export interface JobsTrayProps {
  jobs: BackgroundJob[];
  /** 失敗那一列的 ✕ */
  onDismiss?: (id: string) => void;
  /** 預設 fixed 於視窗右下；false 時改為 absolute，交給父層定位 */
  fixed?: boolean;
  /** 進行中圓點的顏色，預設 AutoLens 金 */
  accent?: string;
  labels?: JobsTrayLabels;
  className?: string;
}

export function JobsTray({ jobs: allJobs, onDismiss, fixed = true, accent = "#eab308", labels, className }: JobsTrayProps) {
  const t = { ...defaultLabels, ...labels };
  const jobs = allJobs.filter(isJobWorthShowing);

  const stateLabel = (job: BackgroundJob) => {
    switch (job.state) {
      case "running":
        return job.progress !== undefined ? `${Math.round(job.progress * 100)}%` : t.running;
      case "completed":
        return t.completed;
      case "failed":
        return t.failed;
      case "cancelled":
        return t.cancelled;
      default:
        return t.queued;
    }
  };

  // 沒有工作時清單是空的，不佔畫面，但保留 live region 讓報讀器接得到下一則
  return (
    <div
      role="region"
      aria-label={t.region}
      style={{ ...tokens, "--al-accent": accent } as CSSProperties}
      className={cn(
        fixed ? "fixed z-[9998]" : "absolute z-10",
        "right-4 bottom-4 flex w-64 max-w-[calc(100%-2rem)] flex-col gap-1 pointer-events-none",
        className,
      )}
    >
      <ul aria-live="polite" className="contents">
        {jobs.map((job) => (
          <li
            key={job.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-[8px] border px-3 py-2 text-xs shadow-lg backdrop-blur",
              job.state === "failed"
                ? "border-[var(--al-danger)] bg-[var(--al-bg-elevated)] text-[var(--al-text-primary)]"
                : "border-[var(--al-border)] bg-[var(--al-bg-elevated)] text-[var(--al-text-secondary)]",
            )}
          >
            {job.state === "running" && (
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--al-accent)] motion-reduce:animate-none" />
            )}
            <span className="min-w-0 flex-1 truncate" title={job.errorCode ?? job.label}>
              {job.label}
            </span>
            <span className={cn("tabular-nums", job.state === "failed" ? "text-[var(--al-danger)]" : "text-[var(--al-text-muted)]")}>
              {stateLabel(job)}
            </span>
            {job.state === "running" && job.onCancel && (
              <button
                type="button"
                onClick={job.onCancel}
                className="text-[var(--al-text-muted)] hover:text-[var(--al-danger)]"
                aria-label={t.cancel}
                title={t.cancel}
              >
                ✕
              </button>
            )}
            {job.state === "failed" && (
              <button
                type="button"
                onClick={() => onDismiss?.(job.id)}
                className="text-[var(--al-text-muted)] hover:text-[var(--al-text-primary)]"
                aria-label={t.dismiss}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
