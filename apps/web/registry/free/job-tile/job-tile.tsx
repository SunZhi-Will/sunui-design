"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 網格裡的一格生成：生成中用模糊的參考圖當底圖並疊上掃光，失敗或等待複查時換成虛線格。
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

export interface JobTileLabels {
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
  seconds?: (s: number) => string;
  progress?: string;
  heldNote?: string;
  cancel?: string;
  cancelAria?: string;
  remove?: string;
  removeAria?: string;
  openAria?: (prompt: string) => string;
  detailAria?: (prompt: string) => string;
  count?: (n: number) => string;
  reference?: string;
  previewAlt?: string;
  actionFailed?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

/** 秒數轉成「1m 20s」這類短字串，單位依語言 */
const duration = (m: string, s: string, sep = " ") => (sec: number) => {
  const v = Math.max(0, Math.round(sec));
  if (v < 60) return `${v}${s}`;
  const mm = Math.floor(v / 60);
  const r = v % 60;
  return r ? `${mm}${m}${sep}${r}${s}` : `${mm}${m}`;
};

const MESSAGES: Record<SunLocale, Required<JobTileLabels>> = {
  en: {
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
    seconds: duration("m", "s"),
    progress: "Generation progress",
    heldNote: "These images are waiting for manual review. They haven't been deleted and will come back once cleared. Your quota has been refunded.",
    cancel: "Cancel",
    cancelAria: "Cancel this generation",
    remove: "Remove record",
    removeAria: "Remove this record",
    openAria: (p) => `View progress: ${p}`,
    detailAria: (p) => `View details: ${p}`,
    count: (n) => `${n} images`,
    reference: "Reference",
    previewAlt: "Preview while generating",
    actionFailed: "That didn't work. Please try again.",
  },
  "zh-TW": {
    queued: (ahead) => `排隊中，前面還有 ${ahead} 位`,
    startingSoon: "即將開始",
    planning: "AI 正在理解你的描述",
    loading: "載入模型中",
    sampling: (s, t) => `生成中 ${s}/${t}`,
    decoding: "輸出圖片中",
    refining: (s, t) => (t ? `修飾臉部 ${s}/${t}` : "修飾臉部中"),
    checking: "檢查結果中",
    done: "完成",
    held: "等待人工複查",
    deleted: "圖片已刪除",
    blocked: "未執行",
    error: "生成沒有完成",
    canceled: "已取消",
    eta: (time) => `約剩 ${time}`,
    seconds: duration(" 分", " 秒"),
    progress: "生成進度",
    heldNote: "這些圖片正在等待人工複查，並沒有被刪除，複查通過後就會回來。額度已退還。",
    cancel: "取消",
    cancelAria: "取消這次生成",
    remove: "移除紀錄",
    removeAria: "移除這筆紀錄",
    openAria: (p) => `查看進度：${p}`,
    detailAria: (p) => `查看詳情：${p}`,
    count: (n) => `${n} 張`,
    reference: "參考圖",
    previewAlt: "生成中的預覽",
    actionFailed: "操作失敗，請再試一次。",
  },
  "zh-CN": {
    queued: (ahead) => `排队中，前面还有 ${ahead} 位`,
    startingSoon: "即将开始",
    planning: "AI 正在理解你的描述",
    loading: "正在加载模型",
    sampling: (s, t) => `生成中 ${s}/${t}`,
    decoding: "正在输出图片",
    refining: (s, t) => (t ? `修饰面部 ${s}/${t}` : "正在修饰面部"),
    checking: "正在检查结果",
    done: "完成",
    held: "等待人工复审",
    deleted: "图片已删除",
    blocked: "未执行",
    error: "生成未完成",
    canceled: "已取消",
    eta: (time) => `约剩 ${time}`,
    seconds: duration(" 分", " 秒"),
    progress: "生成进度",
    heldNote: "这些图片正在等待人工复审，并没有被删除，复审通过后就会恢复。额度已退还。",
    cancel: "取消",
    cancelAria: "取消这次生成",
    remove: "移除记录",
    removeAria: "移除这条记录",
    openAria: (p) => `查看进度：${p}`,
    detailAria: (p) => `查看详情：${p}`,
    count: (n) => `${n} 张`,
    reference: "参考图",
    previewAlt: "生成中的预览",
    actionFailed: "操作失败，请重试。",
  },
  ja: {
    queued: (ahead) => `順番待ち、前に ${ahead} 件`,
    startingSoon: "まもなく開始",
    planning: "AI がプロンプトを解析中",
    loading: "モデルを読み込み中",
    sampling: (s, t) => `生成中 ${s}/${t}`,
    decoding: "画像を書き出し中",
    refining: (s, t) => (t ? `顔を補正中 ${s}/${t}` : "顔を補正中"),
    checking: "結果を確認中",
    done: "完了",
    held: "手動審査待ち",
    deleted: "画像は削除されました",
    blocked: "未実行",
    error: "生成が完了しませんでした",
    canceled: "キャンセル済み",
    eta: (time) => `残り約 ${time}`,
    seconds: duration("分", "秒", ""),
    progress: "生成の進捗",
    heldNote: "これらの画像は手動審査待ちです。削除されてはおらず、審査が終わると戻ります。クォータは返還済みです。",
    cancel: "キャンセル",
    cancelAria: "この生成をキャンセル",
    remove: "記録を削除",
    removeAria: "この記録を削除",
    openAria: (p) => `進捗を見る：${p}`,
    detailAria: (p) => `詳細を見る：${p}`,
    count: (n) => `${n} 枚`,
    reference: "参考画像",
    previewAlt: "生成中のプレビュー",
    actionFailed: "うまくいきませんでした。もう一度お試しください。",
  },
};

export function jobStatusLabel(job: Job, labels?: JobTileLabels, locale = "en") {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
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
@keyframes jt-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.jt-shimmer { background: linear-gradient(100deg, var(--yc-muted) 30%, color-mix(in oklab, var(--yc-muted), var(--yc-fg) 6%) 50%, var(--yc-muted) 70%); background-size: 200% 100%; animation: jt-shimmer 1.8s linear infinite; }
.jt-shimmer-over { background: linear-gradient(100deg, transparent 30%, color-mix(in oklab, var(--yc-bg) 35%, transparent) 50%, transparent 70%); background-size: 200% 100%; animation: jt-shimmer 1.8s linear infinite; }
.jt-preview { image-rendering: auto; filter: blur(6px) saturate(1.05); transform: scale(1.04); transition: filter 600ms cubic-bezier(0.23,1,0.32,1), opacity 600ms cubic-bezier(0.23,1,0.32,1); }
@media (prefers-reduced-motion: reduce) { .jt-shimmer, .jt-shimmer-over { animation: none; } .jt-preview { transition: none; } }
`;

function Styles() {
  return <style href="sunui-job-tile" precedence="default">{css}</style>;
}

function Icon({ d, className }: { d: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)}>
      {d}
    </svg>
  );
}

const P = {
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

/** 生成中、還沒有即時預覽時，用參考圖當底圖並疊上掃光 */
function SourceUnderlay({ src }: { src: string }) {
  return (
    <>
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-105 object-cover blur-[2px] brightness-75 saturate-75" />
      <div aria-hidden className="jt-shimmer-over absolute inset-0" />
    </>
  );
}

function SourceChip({ src, label }: { src: string; label: string }) {
  return (
    <span className="pointer-events-none flex items-center gap-1 rounded-[0.4rem] bg-[color-mix(in_oklab,var(--yc-bg)_88%,transparent)] p-0.5 pr-1.5 text-[11px] backdrop-blur-sm">
      <img src={src} alt="" className="size-6 rounded-[4px] object-cover" />
      <Icon d={P.image} className="size-3 text-[var(--yc-muted-fg)]" />
      <span>{label}</span>
    </span>
  );
}

const glass = "bg-[color-mix(in_oklab,var(--yc-bg)_88%,transparent)] backdrop-blur-sm";

export interface JobTileProps {
  job: Job;
  /** 點格子到進度頁 */
  onOpen?: () => void;
  onCancel?: () => void | Promise<unknown>;
  onRemove?: () => void | Promise<unknown>;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: JobTileLabels;
  className?: string;
}

/** 網格裡的格子：生成中、失敗或等待複查的一次生成，點一下到進度頁 */
export function JobTile({ job, onOpen, onCancel, onRemove, locale = "en", labels, className }: JobTileProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const actions = useActions(t.actionFailed);
  const active = isActive(job);

  if (active) {
    const showPreview = !!job.previewSrc && (job.status === "sampling" || job.status === "decoding");
    return (
      <div
        className={cn(tokens, "group relative overflow-hidden rounded-[0.5rem] bg-[var(--yc-muted)] text-[var(--yc-fg)]", !showPreview && !job.sourceSrc && "jt-shimmer", className)}
        style={{ aspectRatio: job.aspect ?? "2 / 3" }}
        aria-busy
      >
        <Styles />
        {job.sourceSrc && !showPreview ? <SourceUnderlay src={job.sourceSrc} /> : null}
        {showPreview ? (
          <img src={job.previewSrc} alt={t.previewAlt} className="jt-preview absolute inset-0 size-full object-cover" />
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
            {jobStatusLabel(job, t)}
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
        <span className="truncate">{jobStatusLabel(job, t)}</span>
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
