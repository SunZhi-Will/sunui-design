"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// Everything for background work: the shared Job type, progress and status text, four-language strings, plus the jobs tray JobsTray at the bottom right.
// The other layouts (single row JobRow, sidebar JobPanel, grid JobTile, status dot JobStatusDot) are in ./job-views.

/* ───────────── Language ───────────── */

export type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
export function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

/** Formats seconds as a short string such as "1m 5s", in the style of the target language */
export function formatSeconds(s: number, unit: { s: string; m: string; gap: string }) {
  const v = Math.max(0, Math.round(s));
  if (v < 60) return `${v}${unit.s}`;
  const m = Math.floor(v / 60);
  const r = v % 60;
  return r ? `${m}${unit.m}${unit.gap}${r}${unit.s}` : `${m}${unit.m}`;
}

/* ───────────── Generation Job (shared by JobPanel, JobTile, JobRow) ───────────── */

// The percentage is not linear: queued 2, planning 6, loading 14, generating 15 plus 80 times the step ratio, checking 97.

export type JobStatus =
  | "queued"
  | "planning"
  | "loading"
  | "sampling"
  | "decoding"
  | "refining"
  | "checking"
  | "done"
  | "blocked"
  | "error"
  | "canceled";

export interface Job {
  id: string;
  prompt: string;
  status: JobStatus;
  /** Current and total steps of sampling or refining */
  step?: number;
  total?: number;
  /** Queue position, 1 means you are next */
  queuePosition?: number;
  /** Estimated seconds remaining */
  etaSeconds?: number | null;
  /** Elapsed seconds once finished */
  durationSeconds?: number | null;
  /** Reference image: blurred as the base while generating, with a sweeping shine on top */
  sourceSrc?: string;
  /** Live preview image (low resolution); replaces the shine when present */
  previewSrc?: string;
  /** Aspect ratio, for example "2 / 3" */
  aspect?: string;
  /** How many images one generation produces */
  count?: number;
  /** Number of images when finished; 0 means awaiting review or deleted */
  images?: number;
  /** Awaiting manual review */
  held?: boolean;
  error?: string;
  hint?: string;
  /** Info under the sidebar title, for example creation time and style */
  meta?: string[];
}

export const ACTIVE: JobStatus[] = ["queued", "planning", "loading", "sampling", "decoding", "refining", "checking"];
export const isActive = (job: Pick<Job, "status">) => ACTIVE.includes(job.status);

export function stepIndex(status: JobStatus) {
  if (status === "queued" || status === "planning") return 0;
  if (status === "loading") return 1;
  if (status === "sampling" || status === "decoding" || status === "refining") return 2;
  if (status === "checking") return 3;
  return 4;
}

export function jobPercent(job: Job) {
  const ratio = job.total ? (job.step ?? 0) / job.total : 0;
  switch (job.status) {
    case "queued":
      return 2;
    case "planning":
      return 6;
    case "loading":
      return 14;
    case "sampling":
      return 15 + 80 * ratio;
    case "decoding":
      return 94;
    case "refining":
      return 95 + ratio;
    case "checking":
      return 97;
    default:
      return 100;
  }
}

/** Collapses the fine-grained generation statuses into five coarse ones, for the tray and the status dot */
export function jobPhase(job: Pick<Job, "status">): BackgroundJobState {
  if (job.status === "queued") return "queued";
  if (isActive(job)) return "running";
  if (job.status === "done") return "completed";
  if (job.status === "canceled") return "cancelled";
  return "failed";
}

/* ───────────── Strings ───────────── */

/** Status text and shared strings, used by both JobPanel and JobTile */
export interface JobStatusLabels {
  queued?: (ahead: number) => string;
  startingSoon?: string;
  planning?: string;
  loading?: string;
  sampling?: (step: number, total: number) => string;
  decoding?: string;
  refining?: (step: number, total: number) => string;
  checking?: string;
  done?: string;
  held?: string;
  deleted?: string;
  blocked?: string;
  error?: string;
  canceled?: string;
  eta?: (time: string) => string;
  took?: (time: string) => string;
  seconds?: (s: number) => string;
  progress?: string;
  heldNote?: string;
  cancel?: string;
  remove?: string;
  actionFailed?: string;
}

export interface JobPanelLabels extends JobStatusLabels {
  steps?: [string, string, string, string, string];
  leaveNote?: string;
  deletedNote?: string;
  cancelAndEdit?: string;
  retry?: string;
  edit?: string;
}

export interface JobTileLabels extends JobStatusLabels {
  cancelAria?: string;
  removeAria?: string;
  openAria?: (prompt: string) => string;
  detailAria?: (prompt: string) => string;
  count?: (n: number) => string;
  reference?: string;
  previewAlt?: string;
}

export interface JobRowLabels {
  failedRow?: string;
  progress?: string;
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

type PanelOnly = Required<Omit<JobPanelLabels, keyof JobStatusLabels>>;
type TileOnly = Required<Omit<JobTileLabels, keyof JobStatusLabels>>;
interface Messages {
  status: Required<JobStatusLabels>;
  panel: PanelOnly;
  tile: TileOnly;
  row: Required<JobRowLabels>;
  tray: Required<JobsTrayLabels>;
}

const MESSAGES: Record<SunLocale, Messages> = {
  en: {
    status: {
      queued: (ahead) => `In queue, ${ahead} ahead of you`,
      startingSoon: "Starting soon",
      planning: "AI is reading your prompt",
      loading: "Loading model",
      sampling: (s, t) => `Generating ${s}/${t}`,
      decoding: "Writing image",
      refining: (s, t) => (t ? `Refining faces ${s}/${t}` : "Refining faces"),
      checking: "Checking the result",
      done: "Done",
      held: "Waiting for manual review",
      deleted: "Images deleted",
      blocked: "Not run",
      error: "Generation didn't finish",
      canceled: "Canceled",
      eta: (time) => `About ${time} left`,
      took: (time) => `Took ${time}`,
      seconds: (s) => formatSeconds(s, { s: "s", m: "m", gap: " " }),
      progress: "Generation progress",
      heldNote: "These images are waiting for manual review. They haven't been deleted and will come back once cleared. Your quota has been refunded.",
      cancel: "Cancel",
      remove: "Remove record",
      actionFailed: "That didn't work. Please try again.",
    },
    panel: {
      steps: ["Read prompt", "Load model", "Generate", "Safety check", "Done"],
      leaveNote: "Leaving this page won't stop generation. Finished images appear first on the create page.",
      deletedNote: "The images from this run have been deleted.",
      cancelAndEdit: "Cancel and edit prompt",
      retry: "Retry",
      edit: "Edit prompt",
    },
    tile: {
      cancelAria: "Cancel this generation",
      removeAria: "Remove this record",
      openAria: (p) => `View progress: ${p}`,
      detailAria: (p) => `View details: ${p}`,
      count: (n) => `${n} images`,
      reference: "Reference",
      previewAlt: "Preview while generating",
    },
    row: { failedRow: "Generation failed, open to view and retry", progress: "Generation progress" },
    tray: {
      region: "Background jobs",
      running: "In progress",
      completed: "Done",
      failed: "Failed",
      cancelled: "Cancelled",
      queued: "Queued",
      dismiss: "Dismiss",
      cancel: "Cancel this job",
    },
  },
  "zh-TW": {
    status: {
      queued: (ahead) => `排隊中，前面還有 ${ahead} 位`,
      startingSoon: "即將開始",
      planning: "AI 正在理解你的描述",
      loading: "正在載入模型",
      sampling: (s, t) => `生成中 ${s}/${t}`,
      decoding: "正在輸出圖片",
      refining: (s, t) => (t ? `修飾臉部 ${s}/${t}` : "修飾臉部"),
      checking: "正在檢查結果",
      done: "完成",
      held: "等待人工複查",
      deleted: "圖片已刪除",
      blocked: "未執行",
      error: "生成沒有完成",
      canceled: "已取消",
      eta: (time) => `約剩 ${time}`,
      took: (time) => `耗時 ${time}`,
      seconds: (s) => formatSeconds(s, { s: " 秒", m: " 分", gap: " " }),
      progress: "生成進度",
      heldNote: "這些圖片正在等待人工複查，並沒有被刪除，通過後就會回來。額度已退還。",
      cancel: "取消",
      remove: "刪除紀錄",
      actionFailed: "操作沒有成功，請再試一次。",
    },
    panel: {
      steps: ["理解描述", "載入模型", "生成", "安全檢查", "完成"],
      leaveNote: "離開這個頁面不會中斷生成，完成的圖片會優先出現在創作頁。",
      deletedNote: "這次生成的圖片已被刪除。",
      cancelAndEdit: "取消並修改描述",
      retry: "重試",
      edit: "修改描述",
    },
    tile: {
      cancelAria: "取消這次生成",
      removeAria: "移除這筆紀錄",
      openAria: (p) => `查看進度：${p}`,
      detailAria: (p) => `查看詳情：${p}`,
      count: (n) => `${n} 張`,
      reference: "參考圖",
      previewAlt: "生成中的預覽",
    },
    row: { failedRow: "生成失敗，點開查看並重試", progress: "生成進度" },
    tray: {
      region: "背景工作",
      running: "進行中",
      completed: "完成",
      failed: "失敗",
      cancelled: "已取消",
      queued: "排隊中",
      dismiss: "關閉",
      cancel: "取消這項工作",
    },
  },
  "zh-CN": {
    status: {
      queued: (ahead) => `排队中，前面还有 ${ahead} 位`,
      startingSoon: "即将开始",
      planning: "AI 正在理解你的描述",
      loading: "正在加载模型",
      sampling: (s, t) => `生成中 ${s}/${t}`,
      decoding: "正在输出图片",
      refining: (s, t) => (t ? `修饰面部 ${s}/${t}` : "修饰面部"),
      checking: "正在检查结果",
      done: "完成",
      held: "等待人工复审",
      deleted: "图片已删除",
      blocked: "未执行",
      error: "生成未完成",
      canceled: "已取消",
      eta: (time) => `约剩 ${time}`,
      took: (time) => `耗时 ${time}`,
      seconds: (s) => formatSeconds(s, { s: " 秒", m: " 分", gap: " " }),
      progress: "生成进度",
      heldNote: "这些图片正在等待人工复审，并没有被删除，通过后就会恢复。额度已退还。",
      cancel: "取消",
      remove: "删除记录",
      actionFailed: "操作未成功，请重试。",
    },
    panel: {
      steps: ["理解描述", "加载模型", "生成", "安全检查", "完成"],
      leaveNote: "离开此页面不会中断生成，完成的图片会优先显示在创作页。",
      deletedNote: "本次生成的图片已被删除。",
      cancelAndEdit: "取消并修改描述",
      retry: "重试",
      edit: "修改描述",
    },
    tile: {
      cancelAria: "取消这次生成",
      removeAria: "移除这条记录",
      openAria: (p) => `查看进度：${p}`,
      detailAria: (p) => `查看详情：${p}`,
      count: (n) => `${n} 张`,
      reference: "参考图",
      previewAlt: "生成中的预览",
    },
    row: { failedRow: "生成失败，点开查看并重试", progress: "生成进度" },
    tray: {
      region: "后台任务",
      running: "进行中",
      completed: "完成",
      failed: "失败",
      cancelled: "已取消",
      queued: "排队中",
      dismiss: "关闭",
      cancel: "取消此任务",
    },
  },
  ja: {
    status: {
      queued: (ahead) => `順番待ち、あと ${ahead} 件`,
      startingSoon: "まもなく開始",
      planning: "AI がプロンプトを読んでいます",
      loading: "モデルを読み込み中",
      sampling: (s, t) => `生成中 ${s}/${t}`,
      decoding: "画像を書き出し中",
      refining: (s, t) => (t ? `顔を補正中 ${s}/${t}` : "顔を補正中"),
      checking: "結果をチェック中",
      done: "完了",
      held: "手動審査待ち",
      deleted: "画像は削除されました",
      blocked: "実行されませんでした",
      error: "生成が完了しませんでした",
      canceled: "キャンセル済み",
      eta: (time) => `残り約 ${time}`,
      took: (time) => `所要時間 ${time}`,
      seconds: (s) => formatSeconds(s, { s: "秒", m: "分", gap: "" }),
      progress: "生成の進捗",
      heldNote: "これらの画像は手動審査待ちです。削除されてはおらず、審査を通過すると戻ってきます。利用枠は返却済みです。",
      cancel: "キャンセル",
      remove: "履歴を削除",
      actionFailed: "うまくいきませんでした。もう一度お試しください。",
    },
    panel: {
      steps: ["プロンプト解析", "モデル読込", "生成", "安全チェック", "完了"],
      leaveNote: "このページを離れても生成は止まりません。完成した画像は作成ページに先に表示されます。",
      deletedNote: "今回生成した画像は削除されました。",
      cancelAndEdit: "キャンセルして編集",
      retry: "再試行",
      edit: "プロンプトを編集",
    },
    tile: {
      cancelAria: "この生成をキャンセル",
      removeAria: "この記録を削除",
      openAria: (p) => `進捗を見る：${p}`,
      detailAria: (p) => `詳細を見る：${p}`,
      count: (n) => `${n} 枚`,
      reference: "参考画像",
      previewAlt: "生成中のプレビュー",
    },
    row: { failedRow: "生成に失敗しました。開いて確認し、再試行してください", progress: "生成の進行状況" },
    tray: {
      region: "バックグラウンド処理",
      running: "処理中",
      completed: "完了",
      failed: "失敗",
      cancelled: "キャンセル済み",
      queued: "待機中",
      dismiss: "閉じる",
      cancel: "この処理をキャンセル",
    },
  },
};

/** A full set of built-in strings for one language (five groups: status, panel, tile, row, tray) */
export function jobMessages(locale?: string): Messages {
  return MESSAGES[resolveLocale(locale)];
}

export function jobStatusLabel(job: Job, labels?: JobStatusLabels, locale = "en") {
  const t = { ...jobMessages(locale).status, ...labels };
  const step = job.step ?? 0;
  const total = job.total ?? 0;
  switch (job.status) {
    case "queued":
      return (job.queuePosition ?? 0) > 1 ? t.queued((job.queuePosition ?? 0) - 1) : t.startingSoon;
    case "planning":
      return t.planning;
    case "loading":
      return t.loading;
    case "sampling":
      return t.sampling(step, total);
    case "decoding":
      return t.decoding;
    case "refining":
      return t.refining(step, total);
    case "checking":
      return t.checking;
    case "done":
      return job.images ? t.done : job.held ? t.held : t.deleted;
    case "blocked":
      return t.blocked;
    case "error":
      return t.error;
    case "canceled":
      return t.canceled;
  }
}

/* ───────────── Jobs tray JobsTray ───────────── */

/* AutoLens dark tokens, bundled with the component and independent of the site theme */
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
  /** Only used to decide whether to show it; for example internal jobs like hash are shown only on failure */
  type?: string;
  /** Name shown to the user, for example "Saving camera track" */
  label: string;
  state: BackgroundJobState;
  /** 0 to 1; undefined when progress is unknown */
  progress?: number;
  errorCode?: string;
  startedAt: number;
  endedAt?: number;
  /** A cancelable job gets an extra ✕ on the panel */
  onCancel?: () => void;
}

/** A job that finishes faster than this is not worth a "done" notice afterwards */
const QUICK_JOB_MS = 1500;
/** How long a finished job stays in the list before it is removed */
const COMPLETED_TTL_MS = 8000;

/**
 * Whether this job should appear on the panel: failed and canceled jobs always show; hash jobs
 * show only on failure; a job that finishes quickly gets no "done" notice.
 */
export function isJobWorthShowing(job: BackgroundJob): boolean {
  if (job.state === "failed" || job.state === "cancelled") return true;
  if (job.type === "hash") return false;
  if (job.state === "completed") return (job.endedAt ?? job.startedAt) - job.startedAt >= QUICK_JOB_MS;
  return true;
}

/** Converts a generation Job into one tray row: the name is the prompt, progress comes from jobPercent, elapsed time from durationSeconds */
export function toBackgroundJob(job: Job, opts?: { label?: string; type?: string; onCancel?: () => void }): BackgroundJob {
  const state = jobPhase(job);
  const ended = state === "running" || state === "queued" ? undefined : job.durationSeconds != null ? job.durationSeconds * 1000 : QUICK_JOB_MS;
  return {
    id: job.id,
    type: opts?.type ?? "generation",
    label: opts?.label ?? job.prompt,
    state,
    ...(state === "running" ? { progress: jobPercent(job) / 100 } : {}),
    ...(job.error ? { errorCode: job.error } : {}),
    startedAt: 0,
    ...(ended !== undefined ? { endedAt: ended } : {}),
    ...(opts?.onCancel && isActive(job) ? { onCancel: opts.onCancel } : {}),
  };
}

/** Background job registry: startJob, updateJob, finishJob, dismissJob, runJob, same behavior as the original service */
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
      // Successful jobs fade out on their own; failed ones stay so the user sees them
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

  /** Wraps a piece of background work: registers it automatically and finishes it on success or failure */
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

export interface JobsTrayProps {
  jobs: BackgroundJob[];
  /** The ✕ on a failed row */
  onDismiss?: (id: string) => void;
  /** Defaults to fixed at the bottom right of the viewport; false switches to absolute so the parent positions it */
  fixed?: boolean;
  /** Color of the in-progress dot, defaults to AutoLens gold */
  accent?: string;
  /** UI language: en, zh-TW, zh-CN, ja. Tags like zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides built-in strings, takes precedence over locale */
  labels?: JobsTrayLabels;
  className?: string;
}

export function JobsTray({ jobs: allJobs, onDismiss, fixed = true, accent = "#eab308", locale = "en", labels, className }: JobsTrayProps) {
  const t = { ...jobMessages(locale).tray, ...labels };
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

  // With no jobs the list is empty and takes no space, but the live region stays so screen readers catch the next one
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
