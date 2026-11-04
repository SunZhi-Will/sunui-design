"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 進度頁的側欄：狀態標題、進度條與具名步驟、排隊位置、錯誤說明、取消或重試。
// 百分比不是線性的：排隊 2、理解 6、載入 14、生成 15 加 80 乘步數比例、檢查 97。

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
  /** 取樣或精修的目前步數與總步數 */
  step?: number;
  total?: number;
  /** 排隊位置，1 表示下一個就是你 */
  queuePosition?: number;
  /** 預計剩下秒數 */
  etaSeconds?: number | null;
  /** 完成後的耗時秒數 */
  durationSeconds?: number | null;
  /** 參考圖：生成中模糊當底圖，上面疊掃光 */
  sourceSrc?: string;
  /** 即時預覽圖（低解析度），有就取代掃光 */
  previewSrc?: string;
  /** 畫面比例，例如 "2 / 3" */
  aspect?: string;
  /** 一次生成幾張 */
  count?: number;
  /** 完成後的張數；0 表示等待複查或已刪除 */
  images?: number;
  /** 等待人工複查 */
  held?: boolean;
  error?: string;
  hint?: string;
  /** 側欄標題下方的資訊，例如建立時間、風格 */
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

export interface JobPanelLabels {
  steps?: [string, string, string, string, string];
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
  leaveNote?: string;
  heldNote?: string;
  deletedNote?: string;
  cancel?: string;
  cancelAndEdit?: string;
  retry?: string;
  edit?: string;
  remove?: string;
  actionFailed?: string;
}

const defaultLabels: Required<JobPanelLabels> = {
  steps: ["Read prompt", "Load model", "Generate", "Safety check", "Done"],
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
  seconds: (s) => {
    const v = Math.max(0, Math.round(s));
    if (v < 60) return `${v}s`;
    const m = Math.floor(v / 60);
    const r = v % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  },
  progress: "Generation progress",
  leaveNote: "Leaving this page won't stop generation. Finished images appear first on the create page.",
  heldNote: "These images are waiting for manual review. They haven't been deleted and will come back once cleared. Your quota has been refunded.",
  deletedNote: "The images from this run have been deleted.",
  cancel: "Cancel",
  cancelAndEdit: "Cancel and edit prompt",
  retry: "Retry",
  edit: "Edit prompt",
  remove: "Remove record",
  actionFailed: "That didn't work. Please try again.",
};

export function jobStatusLabel(job: Job, labels?: JobPanelLabels) {
  const t = { ...defaultLabels, ...labels };
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

// 原專案（Yumecanvas / Vozmira）共用的 zinc 色票，亮暗兩套
const tokens =
  "[--yc-bg:#FAFAFA] [--yc-card:#FFFFFF] [--yc-fg:#18181B] [--yc-muted:#F4F4F5] [--yc-muted-fg:#6B6B73] [--yc-border:#E4E4E7] [--yc-input:#D4D4D8] [--yc-primary:#18181B] [--yc-primary-fg:#FAFAFA] [--yc-ring:#71717A] [--yc-success:#15803D] [--yc-warning:#B45309] [--yc-destructive:#DC2626] " +
  "dark:[--yc-bg:#09090B] dark:[--yc-card:#111113] dark:[--yc-fg:#FAFAFA] dark:[--yc-muted:#27272A] dark:[--yc-muted-fg:#A1A1AA] dark:[--yc-border:rgba(255,255,255,0.08)] dark:[--yc-input:rgba(255,255,255,0.12)] dark:[--yc-primary:#FAFAFA] dark:[--yc-primary-fg:#18181B] dark:[--yc-ring:#A1A1AA] dark:[--yc-success:#4ADE80] dark:[--yc-warning:#FBBF24] dark:[--yc-destructive:#F87171]";

function Icon({ d, className }: { d: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)}>
      {d}
    </svg>
  );
}

const P = {
  check: <path d="M20 6 9 17l-5-5" />,
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  pencil: (
    <>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </>
  ),
};

function Spinner({ className }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;
  return <Icon d={P.loader} className={cn(!reduce && "animate-spin", className)} />;
}

/** 對應原本 shadcn Progress：h-1 灰底，指示條以 translateX 推進 */
function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn("relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-[var(--yc-muted)]", className)}
    >
      <div
        className="size-full flex-1 bg-[var(--yc-primary)] transition-all motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}

type Kind = "cancel" | "rerun" | "delete";
type Action = (() => void | Promise<unknown>) | undefined;

/** 對應原本的 useJobActions：記住哪個動作進行中，失敗時顯示錯誤 */
function useActions(fail: string) {
  const [pending, setPending] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(() => setError(null), 4000);
    return () => window.clearTimeout(id);
  }, [error]);
  const run = async (kind: Kind, fn: Action) => {
    if (!fn) return false;
    setPending(kind);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : fail);
      return false;
    } finally {
      setPending(null);
    }
  };
  return { pending, error, run };
}

function ErrorNote({ text }: { text: string | null }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div role="alert" aria-live="assertive">
      <AnimatePresence>
        {text ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-xs text-[var(--yc-destructive)]"
          >
            <Icon d={P.alert} className="size-3.5" />
            {text}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const btn =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[0.5rem] border border-transparent bg-clip-padding px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-[var(--yc-ring)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--yc-ring)_50%,transparent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";
const btnDefault = "bg-[var(--yc-primary)] text-[var(--yc-primary-fg)] hover:bg-[color-mix(in_oklab,var(--yc-primary)_80%,transparent)]";
const btnOutline =
  "border-[var(--yc-border)] bg-[var(--yc-bg)] hover:bg-[var(--yc-muted)] dark:border-[var(--yc-input)] dark:bg-[color-mix(in_oklab,var(--yc-input)_30%,transparent)] dark:hover:bg-[color-mix(in_oklab,var(--yc-input)_50%,transparent)]";
const btnGhost = "text-[var(--yc-muted-fg)] hover:bg-[var(--yc-muted)] hover:text-[var(--yc-fg)] dark:hover:bg-[color-mix(in_oklab,var(--yc-muted)_50%,transparent)]";

export interface JobPanelProps {
  job: Job;
  /** 取消；回傳的 Promise 失敗會顯示錯誤 */
  onCancel?: () => void | Promise<unknown>;
  /** 帶著原本的描述回到輸入框 */
  onEdit?: () => void;
  onRerun?: () => void | Promise<unknown>;
  onRemove?: () => void | Promise<unknown>;
  /** 放在步驟與操作之間的內容，例如描述、AI 改寫結果 */
  children?: ReactNode;
  labels?: JobPanelLabels;
  className?: string;
}

/** 進度頁的側欄：狀態標題、進度條與具名步驟、錯誤說明、取消或重試 */
export function JobPanel({ job, onCancel, onEdit, onRerun, onRemove, children, labels, className }: JobPanelProps) {
  const t = { ...defaultLabels, ...labels };
  const actions = useActions(t.actionFailed);
  const active = isActive(job);
  const current = stepIndex(job.status);
  const meta = [
    ...(job.meta ?? []),
    active && job.etaSeconds != null ? t.eta(t.seconds(job.etaSeconds)) : null,
    !active && job.durationSeconds != null ? t.took(t.seconds(job.durationSeconds)) : null,
  ].filter(Boolean);

  const cancelAndEdit = async () => {
    if (await actions.run("cancel", onCancel)) onEdit?.();
  };

  return (
    <div className={cn(tokens, "flex min-w-0 flex-col gap-5 text-[var(--yc-fg)]", className)}>
      <div>
        <h2 className="text-lg font-semibold" aria-live="polite">
          {jobStatusLabel(job, labels)}
        </h2>
        {meta.length ? <p className="mt-1 text-xs text-[var(--yc-muted-fg)] tabular-nums">{meta.join("・")}</p> : null}
      </div>

      {active ? (
        <div className="flex flex-col gap-2">
          <ProgressBar value={jobPercent(job)} label={t.progress} />
          <ol className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {t.steps.map((label, i) => (
              <li
                key={label}
                aria-current={i === current ? "step" : undefined}
                className={cn("flex items-center gap-1", i < current ? "text-[var(--yc-fg)]" : i === current ? "font-medium text-[var(--yc-fg)]" : "text-[var(--yc-muted-fg)]")}
              >
                {i < current ? <Icon d={P.check} className="size-3" /> : null}
                {label}
              </li>
            ))}
          </ol>
          <p className="text-xs text-[var(--yc-muted-fg)]">{t.leaveNote}</p>
        </div>
      ) : null}

      {job.status === "blocked" || job.status === "error" ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-[0.5rem] border px-4 py-3 text-sm",
            job.status === "blocked"
              ? "border-[color-mix(in_oklab,var(--yc-warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--yc-warning)_10%,transparent)]"
              : "border-[color-mix(in_oklab,var(--yc-destructive)_25%,transparent)] bg-[color-mix(in_oklab,var(--yc-destructive)_5%,transparent)]",
          )}
        >
          <Icon d={P.alert} className={cn("mt-0.5 size-4", job.status === "blocked" ? "text-[var(--yc-warning)]" : "text-[var(--yc-destructive)]")} />
          <div className="min-w-0">
            <p className="font-medium">{job.error}</p>
            {job.hint ? <p className="mt-0.5 text-[var(--yc-muted-fg)]">{job.hint}</p> : null}
          </div>
        </div>
      ) : null}

      {job.status === "done" && !job.images ? <p className="text-sm text-[var(--yc-muted-fg)]">{job.held ? t.heldNote : t.deletedNote}</p> : null}

      {children}

      <div className="flex flex-col gap-2 border-t border-[var(--yc-border)] pt-4">
        <div className="flex flex-wrap gap-2">
          {active ? (
            <>
              {onEdit && onCancel ? (
                <button type="button" className={cn(btn, btnOutline)} onClick={cancelAndEdit} disabled={actions.pending === "cancel"}>
                  <Icon d={P.pencil} /> {t.cancelAndEdit}
                </button>
              ) : null}
              {onCancel ? (
                <button type="button" className={cn(btn, btnGhost)} onClick={() => actions.run("cancel", onCancel)} disabled={actions.pending === "cancel"}>
                  {actions.pending === "cancel" ? <Spinner /> : <Icon d={P.x} />}
                  {t.cancel}
                </button>
              ) : null}
            </>
          ) : (
            <>
              {onRerun && job.status !== "blocked" && job.status !== "done" ? (
                <button type="button" className={cn(btn, btnDefault)} onClick={() => actions.run("rerun", onRerun)} disabled={actions.pending === "rerun"}>
                  {actions.pending === "rerun" ? <Spinner /> : <Icon d={P.refresh} />}
                  {t.retry}
                </button>
              ) : null}
              {onEdit ? (
                <button type="button" className={cn(btn, btnOutline)} onClick={onEdit}>
                  <Icon d={P.pencil} /> {t.edit}
                </button>
              ) : null}
              {onRemove && job.status !== "done" ? (
                <button type="button" className={cn(btn, btnGhost)} onClick={() => actions.run("delete", onRemove)} disabled={actions.pending === "delete"}>
                  {actions.pending === "delete" ? <Spinner /> : <Icon d={P.trash} />}
                  {t.remove}
                </button>
              ) : null}
            </>
          )}
        </div>
        <ErrorNote text={actions.error} />
      </div>
    </div>
  );
}
