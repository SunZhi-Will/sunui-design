"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

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

/* ───────────── UpdateBanner：同一套深色、金色的更新橫幅 ───────────── */

/** 外部（updater）推進來的事件；checking、not-available 不顯示，等同 idle */
export type UpdaterEvent =
  | { type: "idle" }
  | { type: "available"; version?: string }
  | { type: "progress"; percent: number }
  | { type: "downloaded" }
  | { type: "error"; message: string };

type BannerState =
  | { type: "idle" }
  | { type: "available"; version?: string }
  | { type: "downloading"; percent: number; retryAttempt?: number }
  | { type: "downloaded" }
  | { type: "installing" }
  | { type: "error"; message: string };

type Result = { success: boolean; error?: string } | void | undefined;

// 大檔下載偶爾被 CDN 中途截斷，這類暫時性錯誤自動重試幾次
const MAX_DOWNLOAD_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const TRANSIENT_ERROR_PATTERNS = [
  "ERR_INCOMPLETE_CHUNKED_ENCODING",
  "ERR_CONNECTION_RESET",
  "ERR_CONNECTION_CLOSED",
  "ERR_CONNECTION_ABORTED",
  "ERR_NETWORK_CHANGED",
  "ERR_TIMED_OUT",
  "ERR_EMPTY_RESPONSE",
];
const isTransientDownloadError = (message: string) => TRANSIENT_ERROR_PATTERNS.some((p) => message.includes(p));

export interface UpdateBannerLabels {
  updateAvailable?: (version?: string) => string;
  downloadNow?: string;
  dismissUpdate?: string;
  downloadingUpdate?: (percent: number) => string;
  downloadRetrying?: (attempt: number, max: number) => string;
  updateDownloaded?: string;
  restartNow?: string;
  installingUpdate?: string;
  updateFailed?: (message: string) => string;
  dismissError?: string;
}

const bannerLabels: Required<UpdateBannerLabels> = {
  updateAvailable: (v) => `A new version${v ? ` v${v}` : ""} is available. Ready to update?`,
  downloadNow: "Download Now",
  dismissUpdate: "Dismiss update notice",
  downloadingUpdate: (p) => `Downloading update… ${p}%`,
  downloadRetrying: (a, m) => `Download interrupted, retrying… (${a}/${m})`,
  updateDownloaded: "Update downloaded. After you restart, the app will close for a few seconds then reopen automatically.",
  restartNow: "Restart Now",
  installingUpdate: "Installing update… the app will restart shortly.",
  updateFailed: (m) => `Update failed: ${m}`,
  dismissError: "Dismiss error notice",
};

export interface UpdateBannerProps {
  /** 每次 updater 推來新事件就換一個新物件 */
  event: UpdaterEvent;
  /** 回傳 { success: false, error } 或丟例外視為失敗；暫時性網路錯誤會自動重試 */
  onDownload?: () => Promise<Result>;
  onInstall?: () => Promise<Result>;
  /** 預設 fixed 於視窗頂部並把實際高度寫進 :root 的 --banner-height；false 時改為 absolute */
  fixed?: boolean;
  labels?: UpdateBannerLabels;
  className?: string;
}

const Icon = ({ className, children }: { className?: string; children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {children}
  </svg>
);
const Spinner = () => (
  <Icon className="h-4 w-4 shrink-0 animate-spin text-yellow-300">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
);
const CloseIcon = () => (
  <Icon className="h-3.5 w-3.5">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

export function UpdateBanner({ event, onDownload, onInstall, fixed = true, labels, className }: UpdateBannerProps) {
  const t = { ...bannerLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const [banner, setBanner] = useState<BannerState>({ type: "idle" });
  const [dismissed, setDismissed] = useState(false);
  // 重試進行中壓下外部 error 事件，避免畫面在 error 與重試中之間閃爍
  const retryInFlightRef = useRef(false);

  useEffect(() => {
    switch (event.type) {
      case "available":
        setBanner({ type: "available", version: event.version });
        setDismissed(false);
        break;
      case "progress":
        setBanner({ type: "downloading", percent: Math.round(event.percent ?? 0) });
        break;
      case "downloaded":
        setBanner({ type: "downloaded" });
        setDismissed(false);
        break;
      case "error":
        if (retryInFlightRef.current) break;
        setBanner({ type: "error", message: event.message });
        setDismissed(false);
        break;
      default:
        break;
    }
  }, [event]);

  const isVisible = banner.type !== "idle" && !dismissed;

  // 把橫幅實際高度寫到 :root，讓各畫面可以 calc(var(--titlebar-height) + var(--banner-height)) 讓開
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fixed) return;
    const root = document.documentElement;
    if (!isVisible) {
      root.style.setProperty("--banner-height", "0px");
      return;
    }
    const node = bannerRef.current;
    if (!node) return;
    const sync = () => root.style.setProperty("--banner-height", `${node.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.setProperty("--banner-height", "0px");
    };
  }, [isVisible, fixed]);

  if (!isVisible) return null;

  const handleDownload = async () => {
    retryInFlightRef.current = true;
    try {
      for (let attempt = 0; attempt <= MAX_DOWNLOAD_RETRIES; attempt++) {
        // 立刻給回饋，不等第一個 progress 事件
        setBanner({ type: "downloading", percent: 0, retryAttempt: attempt > 0 ? attempt : undefined });
        let message: string | null = null;
        try {
          const result = await onDownload?.();
          if (!result || result.success !== false) return; // 成功，交給 progress 與 downloaded 事件接手
          message = result.error ?? "downloadUpdate failed";
        } catch (err) {
          message = String(err);
        }
        const canRetry = attempt < MAX_DOWNLOAD_RETRIES && isTransientDownloadError(message);
        if (!canRetry) {
          setBanner({ type: "error", message });
          setDismissed(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    } finally {
      retryInFlightRef.current = false;
    }
  };

  const handleInstall = async () => {
    // 立即切到安裝中，應用程式關閉前的空窗期才不像當機
    setBanner({ type: "installing" });
    try {
      const result = await onInstall?.();
      if (result && result.success === false) {
        setBanner({ type: "error", message: result.error ?? "installUpdateNow failed" });
        setDismissed(false);
      }
    } catch (err) {
      setBanner({ type: "error", message: String(err) });
      setDismissed(false);
    }
  };

  const primary = "shrink-0 px-3 py-0.5 rounded bg-yellow-500 hover:bg-yellow-400 text-[#111111] text-xs font-medium transition-colors";
  const close = "shrink-0 p-1 rounded hover:bg-white/10 transition-colors";

  return (
    <motion.div
      ref={bannerRef}
      role="status"
      aria-live="polite"
      initial={reduce ? false : { y: "-0.25rem" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        fixed ? "fixed top-[var(--titlebar-height,0px)] z-[9998]" : "absolute top-0 z-20",
        "left-0 right-0 flex items-center gap-3 px-4 py-2 text-sm bg-yellow-900/95 border-b border-yellow-500/40 text-yellow-100 backdrop-blur-sm",
        className,
      )}
    >
      {banner.type === "available" && (
        <>
          <Icon className="h-4 w-4 shrink-0 text-yellow-300">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="m8 12 4 4 4-4" />
          </Icon>
          <span className="min-w-0 flex-1">{t.updateAvailable(banner.version)}</span>
          <button type="button" onClick={handleDownload} className={primary}>
            {t.downloadNow}
          </button>
          <button type="button" onClick={() => setDismissed(true)} className={close} aria-label={t.dismissUpdate}>
            <CloseIcon />
          </button>
        </>
      )}

      {banner.type === "downloading" && (
        <>
          <Spinner />
          <span className="min-w-0 flex-1">
            {banner.retryAttempt ? t.downloadRetrying(banner.retryAttempt, MAX_DOWNLOAD_RETRIES) : t.downloadingUpdate(banner.percent)}
          </span>
          <div className="h-1.5 w-32 max-w-[30%] shrink-0 overflow-hidden rounded-full bg-yellow-800">
            <div className="h-full rounded-full bg-yellow-400 transition-all duration-300 motion-reduce:transition-none" style={{ width: `${banner.percent}%` }} />
          </div>
        </>
      )}

      {banner.type === "downloaded" && (
        <>
          <Icon className="h-4 w-4 shrink-0 text-[#e5e5e5]">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </Icon>
          <span className="min-w-0 flex-1">{t.updateDownloaded}</span>
          <button type="button" onClick={handleInstall} className={primary}>
            {t.restartNow}
          </button>
          <button type="button" onClick={() => setDismissed(true)} className={close} aria-label={t.dismissUpdate}>
            <CloseIcon />
          </button>
        </>
      )}

      {banner.type === "installing" && (
        <>
          <Spinner />
          <span className="min-w-0 flex-1">{t.installingUpdate}</span>
        </>
      )}

      {banner.type === "error" && (
        <>
          <Icon className="h-4 w-4 shrink-0 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </Icon>
          <span className="min-w-0 flex-1 break-words text-red-200">{t.updateFailed(banner.message)}</span>
          <button type="button" onClick={() => setDismissed(true)} className={close} aria-label={t.dismissError}>
            <CloseIcon />
          </button>
        </>
      )}
    </motion.div>
  );
}
