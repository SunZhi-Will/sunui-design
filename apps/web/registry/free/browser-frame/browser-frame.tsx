import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BrowserFrameTone = "default" | "danger" | "success" | "brand";
/** auto 跟著深淺色切換；dark／light 固定色，給不吃主題的簡報舞台用 */
export type BrowserFrameScheme = "auto" | "dark" | "light";

/*
 * 色彩 token。auto 沿用部落格 tokens.css（淺色 stone、深色 zinc），
 * dark／light 沿用簡報裝置外框的固定色。
 */
const lightVars =
  "[--wf-surface:#ffffff] [--wf-raised:#f5f5f4] [--wf-sunken:#f3f1ed] [--wf-fg:#1c1917] [--wf-fg-body:#292524] [--wf-fg-muted:#57534e] [--wf-line:rgba(28,25,23,0.1)] [--wf-line-strong:rgba(28,25,23,0.22)] [--wf-dot:rgba(28,25,23,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] [--wf-brand:rgba(217,119,6,0.7)] [--wf-shadow:0_1px_2px_rgba(28,25,23,0.05),0_4px_14px_-6px_rgba(28,25,23,0.08)]";
const darkAutoVars =
  "dark:[--wf-surface:#111113] dark:[--wf-raised:#1a1a1d] dark:[--wf-sunken:#161619] dark:[--wf-fg:#fafafa] dark:[--wf-fg-body:#e4e4e7] dark:[--wf-fg-muted:#e4e4e7] dark:[--wf-line:rgba(255,255,255,0.1)] dark:[--wf-line-strong:rgba(255,255,255,0.22)] dark:[--wf-dot:rgba(250,250,250,0.08)] dark:[--wf-success:rgba(52,211,153,0.6)] dark:[--wf-danger:rgba(248,113,113,0.6)] dark:[--wf-brand:rgba(250,204,21,0.7)] dark:[--wf-shadow:none]";
const fixedDark =
  "[--wf-surface:#151518] [--wf-raised:#1c1c20] [--wf-sunken:#1c1c20] [--wf-fg:#f6f1e6] [--wf-fg-body:#f6f1e6] [--wf-fg-muted:#bdb6a6] [--wf-line:#3a3a42] [--wf-line-strong:#3a3a42] [--wf-dot:rgba(246,241,230,0.08)] [--wf-success:rgba(52,211,153,0.6)] [--wf-danger:rgba(248,113,113,0.6)] [--wf-brand:rgba(232,184,74,0.7)] [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)]";
const fixedLight =
  "[--wf-surface:#ffffff] [--wf-raised:#e8e0cf] [--wf-sunken:#f4efe4] [--wf-fg:#17140d] [--wf-fg-body:#17140d] [--wf-fg-muted:#58513f] [--wf-line:#cfc6ae] [--wf-line-strong:#cfc6ae] [--wf-dot:rgba(23,20,13,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] [--wf-brand:rgba(138,90,0,0.7)] [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)]";

const schemeVars: Record<BrowserFrameScheme, string> = {
  auto: `${lightVars} ${darkAutoVars}`,
  dark: fixedDark,
  light: fixedLight,
};

const toneRing: Record<BrowserFrameTone, string> = {
  default: "border-[var(--wf-line-strong)]",
  danger: "border-[var(--wf-danger)]",
  success: "border-[var(--wf-success)]",
  brand: "border-[var(--wf-brand)]",
};

/** macOS 紅黃綠三顆燈 */
function TrafficLights({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 gap-1.5", className)}>
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
    </span>
  );
}

function SimBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex-none rounded-full border border-[var(--wf-line-strong)] bg-[var(--wf-sunken)] px-2 py-px text-[11px] font-bold tracking-[0.04em] text-[var(--wf-fg-muted)]">
      {children}
    </span>
  );
}

function LockIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ───────── 電腦瀏覽器 ───────── */

export interface BrowserFrameProps {
  /** 網址列（只顯示網域與路徑） */
  url: string;
  /** 分頁標題，不給就顯示網址 */
  title?: ReactNode;
  tone?: BrowserFrameTone;
  scheme?: BrowserFrameScheme;
  badge?: ReactNode;
  maxHeight?: number;
  children: ReactNode;
  className?: string;
}

export function BrowserFrame({
  url,
  title,
  tone = "default",
  scheme = "auto",
  badge,
  maxHeight,
  children,
  className,
}: BrowserFrameProps) {
  return (
    <figure
      aria-label={`Browser window, ${url}`}
      className={cn(
        "m-0 min-w-0 overflow-hidden rounded-xl border bg-[var(--wf-surface)] text-[var(--wf-fg)] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition-colors",
        schemeVars[scheme],
        toneRing[tone],
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-2.5 border-b border-[var(--wf-line-strong)] bg-[var(--wf-raised)] px-3 py-2 text-xs text-[var(--wf-fg-muted)]"
      >
        <TrafficLights />
        <span className="min-w-0 flex-1 truncate text-center">
          {title ?? url}
        </span>
        {badge && <SimBadge>{badge}</SimBadge>}
      </div>
      <div className="mx-3 my-2 flex items-center gap-2 rounded-full border border-[var(--wf-line-strong)] bg-[var(--wf-sunken)] px-3 py-1.5 text-[12.5px] text-[var(--wf-fg-muted)]">
        <LockIcon size={12} />
        <span className="truncate text-[var(--wf-fg)]">{url}</span>
      </div>
      <div
        className="min-h-[120px]"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        {children}
      </div>
    </figure>
  );
}
