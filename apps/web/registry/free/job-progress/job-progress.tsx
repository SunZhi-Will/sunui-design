"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 一次生成的進度：網格裡的格子（JobTile）、進度頁的側欄（JobPanel）、控制台的單行列（JobRow）。
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

export interface JobProgressLabels {
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
  noImage?: string;
  cancel?: string;
  cancelAria?: string;
  cancelAndEdit?: string;
  retry?: string;
  edit?: string;
  remove?: string;
  removeAria?: string;
  openAria?: (prompt: string) => string;
  detailAria?: (prompt: string) => string;
  count?: (n: number) => string;
  reference?: string;
  previewAlt?: string;
  failedRow?: string;
  actionFailed?: string;
}

const defaultLabels: Required<JobProgressLabels> = {
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
  noImage: "No image this time",
  cancel: "Cancel",
  cancelAria: "Cancel this generation",
  cancelAndEdit: "Cancel and edit prompt",
  retry: "Retry",
  edit: "Edit prompt",
  remove: "Remove record",
  removeAria: "Remove this record",
  openAria: (p) => `View progress: ${p}`,
  detailAria: (p) => `View details: ${p}`,
  count: (n) => `${n} images`,
  reference: "Reference",
  previewAlt: "Preview while generating",
  failedRow: "Generation failed, open to view and retry",
  actionFailed: "That didn't work. Please try again.",
};

export function jobStatusLabel(job: Job, labels?: JobProgressLabels) {
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
const ringFocus = "outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--yc-ring)_50%,transparent)]";

// 原本 globals.css 的 shimmer、shimmer-over、gen-preview
const css = `
@keyframes jp-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.jp-shimmer { background: linear-gradient(100deg, var(--yc-muted) 30%, color-mix(in oklab, var(--yc-muted), var(--yc-fg) 6%) 50%, var(--yc-muted) 70%); background-size: 200% 100%; animation: jp-shimmer 1.8s linear infinite; }
.jp-shimmer-over { background: linear-gradient(100deg, transparent 30%, color-mix(in oklab, var(--yc-bg) 35%, transparent) 50%, transparent 70%); background-size: 200% 100%; animation: jp-shimmer 1.8s linear infinite; }
.jp-preview { image-rendering: auto; filter: blur(6px) saturate(1.05); transform: scale(1.04); transition: filter 600ms cubic-bezier(0.23,1,0.32,1), opacity 600ms cubic-bezier(0.23,1,0.32,1); }
@media (prefers-reduced-motion: reduce) { .jp-shimmer, .jp-shimmer-over { animation: none; } .jp-preview { transition: none; } }
`;

function Styles() {
  return <style href="sunui-job-progress" precedence="default">{css}</style>;
}

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
  eyeOff: (
    <>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </>
  ),
  image: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
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
  chevronRight: <path d="m9 18 6-6-6-6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
  file: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
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

/** 生成中、還沒有即時預覽時，用參考圖當底圖並疊上掃光 */
function SourceUnderlay({ src }: { src: string }) {
  return (
    <>
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-105 object-cover blur-[2px] brightness-75 saturate-75" />
      <div aria-hidden className="jp-shimmer-over absolute inset-0" />
    </>
  );
}

function SourceChip({ src, label }: { src: string; label: string }) {
  return (
    <span className="pointer-events-none flex items-center gap-1 rounded-[0.4rem] bg-[color-mix(in_oklab,var(--yc-bg)_80%,transparent)] p-0.5 pr-1.5 text-[11px] backdrop-blur">
      <img src={src} alt="" className="size-6 rounded-[4px] object-cover" />
      <Icon d={P.image} className="size-3 text-[var(--yc-muted-fg)]" />
      <span>{label}</span>
    </span>
  );
}

const glass = "bg-[color-mix(in_oklab,var(--yc-bg)_80%,transparent)] backdrop-blur";

export interface JobTileProps {
  job: Job;
  /** 點格子到進度頁 */
  onOpen?: () => void;
  onCancel?: () => void | Promise<unknown>;
  onRemove?: () => void | Promise<unknown>;
  labels?: JobProgressLabels;
  className?: string;
}

/** 網格裡的格子：生成中、失敗或等待複查的一次生成，點一下到進度頁 */
export function JobTile({ job, onOpen, onCancel, onRemove, labels, className }: JobTileProps) {
  const t = { ...defaultLabels, ...labels };
  const actions = useActions(t.actionFailed);
  const active = isActive(job);

  if (active) {
    const showPreview = !!job.previewSrc && (job.status === "sampling" || job.status === "decoding");
    return (
      <div
        className={cn(tokens, "group relative overflow-hidden rounded-[0.5rem] bg-[var(--yc-muted)] text-[var(--yc-fg)]", !showPreview && !job.sourceSrc && "jp-shimmer", className)}
        style={{ aspectRatio: job.aspect ?? "2 / 3" }}
        aria-busy
      >
        <Styles />
        {job.sourceSrc && !showPreview ? <SourceUnderlay src={job.sourceSrc} /> : null}
        {showPreview ? (
          <img src={job.previewSrc} alt={t.previewAlt} className="jp-preview absolute inset-0 size-full object-cover" />
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          aria-label={t.openAria(job.prompt)}
          className="absolute inset-0 z-[1] outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--yc-ring)_50%,transparent)] focus-visible:ring-inset"
        />
        <div className="pointer-events-none absolute top-2 left-2 z-[2] flex items-center gap-1">
          {job.sourceSrc ? <SourceChip src={job.sourceSrc} label={t.reference} /> : null}
          {(job.count ?? 1) > 1 ? <span className={cn("rounded-[0.4rem] px-1.5 py-0.5 text-[11px] whitespace-nowrap tabular-nums", glass)}>{t.count(job.count ?? 1)}</span> : null}
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={() => actions.run("cancel", onCancel)}
            disabled={actions.pending === "cancel"}
            aria-label={t.cancelAria}
            title={t.cancel}
            className={cn("absolute top-2 right-2 z-[2] flex size-7 items-center justify-center rounded-full text-[var(--yc-muted-fg)] hover:text-[var(--yc-fg)]", glass, ringFocus)}
          >
            {actions.pending === "cancel" ? <Spinner className="size-3.5" /> : <Icon d={P.x} className="size-3.5" />}
          </button>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-1.5 bg-gradient-to-t from-[color-mix(in_oklab,var(--yc-bg)_95%,transparent)] via-[color-mix(in_oklab,var(--yc-bg)_75%,transparent)] to-transparent px-2.5 pt-8 pb-2.5">
          <p className="truncate text-xs font-medium" aria-live="polite">
            {jobStatusLabel(job, labels)}
          </p>
          <ProgressBar value={jobPercent(job)} label={t.progress} />
          {job.etaSeconds != null ? <p className="text-[11px] text-[var(--yc-muted-fg)] tabular-nums">{t.eta(t.seconds(job.etaSeconds))}</p> : null}
          {actions.error ? <p className="text-[11px] text-[var(--yc-destructive)]" role="alert">{actions.error}</p> : null}
        </div>
      </div>
    );
  }

  const held = job.status === "done";
  const tone = job.status === "error" ? "text-[var(--yc-destructive)]" : job.status === "blocked" ? "text-[var(--yc-warning)]" : "text-[var(--yc-muted-fg)]";
  const glyph = held ? P.eyeOff : job.status === "canceled" ? P.x : P.alert;
  return (
    <div
      className={cn(
        tokens,
        "group relative flex aspect-square flex-col overflow-hidden rounded-[0.5rem] border border-dashed border-[var(--yc-border)] bg-[color-mix(in_oklab,var(--yc-muted)_30%,transparent)] p-3 text-[var(--yc-fg)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={t.detailAria(job.prompt)}
        className="absolute inset-0 z-[1] rounded-[0.5rem] outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--yc-ring)_50%,transparent)] focus-visible:ring-inset"
      />
      <div className="flex items-center gap-1.5 pr-7 text-xs font-medium">
        <Icon d={glyph} className={cn("size-3.5", tone)} />
        <span className="truncate">{jobStatusLabel(job, labels)}</span>
      </div>
      <p className="mt-2 line-clamp-3 text-xs text-[var(--yc-muted-fg)]">{held ? t.heldNote : job.status === "canceled" ? "" : job.error}</p>
      <div className="mt-auto flex items-end gap-2">
        {job.sourceSrc ? (
          <img src={job.sourceSrc} alt={t.reference} className="size-9 shrink-0 rounded-[0.4rem] border border-[var(--yc-border)] object-cover" />
        ) : null}
        <p className="line-clamp-2 min-w-0 text-[11px] text-[color-mix(in_oklab,var(--yc-muted-fg)_80%,transparent)]">{job.prompt}</p>
      </div>
      {!held && onRemove ? (
        <button
          type="button"
          onClick={() => actions.run("delete", onRemove)}
          disabled={actions.pending === "delete"}
          aria-label={t.removeAria}
          title={t.remove}
          className={cn("absolute top-2 right-2 z-[2] flex size-7 items-center justify-center rounded-full text-[var(--yc-muted-fg)] hover:bg-[var(--yc-muted)] hover:text-[var(--yc-fg)]", ringFocus)}
        >
          {actions.pending === "delete" ? <Spinner className="size-3.5" /> : <Icon d={P.x} className="size-3.5" />}
        </button>
      ) : null}
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
  labels?: JobProgressLabels;
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

// ---------------------------------------------------------------- 單行列（Vozmira 控制台）

const RUNNING = "bg-[var(--yc-muted-fg)] animate-pulse motion-reduce:animate-none";
const WAITING = "bg-[var(--yc-muted-fg)]";

export type JobRowState = "running" | "waiting" | "completed" | "failed";

/** 點加文字的狀態，不用實心徽章：失敗是紅點，進行中是閃爍的墨點，等待是灰點 */
export function JobStatusDot({ state, children, className }: { state: JobRowState; children: ReactNode; className?: string }) {
  const failed = state === "failed";
  const dot = state === "completed" ? "bg-[var(--yc-success)]" : failed ? "bg-[var(--yc-destructive)]" : state === "running" ? RUNNING : WAITING;
  return (
    <span className={cn(tokens, "inline-flex items-center gap-1.5 text-xs font-medium", failed ? "text-[var(--yc-destructive)]" : "text-[var(--yc-muted-fg)]", className)}>
      <span className={cn("inline-block size-1.5 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}

export interface JobRowProps {
  title: string;
  /** 來源類型，例如網址或文字 */
  source?: { kind: "url" | "text"; label: string };
  /** 0 到 100 */
  progress: number;
  /** 進度旁的狀態文字 */
  label: string;
  failed?: boolean;
  href?: string;
  onClick?: () => void;
  labels?: Pick<JobProgressLabels, "failedRow" | "progress">;
  className?: string;
}

/** 控制台裡的單行進度列：刻意不是卡片，讀起來是「進行中、需要留意的工作」 */
export function JobRow({ title, source, progress, label, failed = false, href, onClick, labels, className }: JobRowProps) {
  const t = { ...defaultLabels, ...labels };
  const width = Math.max(0, Math.min(100, progress));
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        tokens,
        "group flex items-center gap-4 px-4 py-3 text-[var(--yc-fg)] transition-colors outline-none hover:bg-[var(--yc-muted)] focus-visible:bg-[var(--yc-muted)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--yc-ring)]",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {source ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--yc-muted-fg)]">
              <Icon d={source.kind === "url" ? P.globe : P.file} className="size-3" />
              {source.label}
            </span>
          ) : null}
        </div>
        {failed ? (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--yc-destructive)]">
            <Icon d={P.alert} className="size-3" />
            {t.failedRow}
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div
                role="progressbar"
                aria-label={t.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(width)}
                className="h-2 overflow-hidden rounded-full border border-[var(--yc-border)] bg-[var(--yc-muted)]"
              >
                <div
                  className="h-full w-full origin-left rounded-full bg-[var(--yc-fg)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  style={{ transform: `scaleX(${width / 100})` } as CSSProperties}
                />
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-[var(--yc-muted-fg)] tabular-nums">
              {label} · {Math.round(width)}%
            </span>
          </div>
        )}
      </div>
      <Icon d={P.chevronRight} className="size-4 text-[var(--yc-muted-fg)] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </a>
  );
}
