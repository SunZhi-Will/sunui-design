"use client";

import { type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 控制台裡的單行進度列（Vozmira），加上點加文字的狀態標示 JobStatusDot。

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
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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

export interface JobRowLabels {
  failedRow?: string;
  progress?: string;
}

const defaultLabels: Required<JobRowLabels> = {
  failedRow: "Generation failed, open to view and retry",
  progress: "Generation progress",
};

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
  labels?: JobRowLabels;
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
