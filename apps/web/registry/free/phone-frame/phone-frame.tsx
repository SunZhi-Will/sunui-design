import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** auto 跟著深淺色切換；dark／light 固定色，給不吃主題的簡報舞台用 */
export type PhoneFrameScheme = "auto" | "dark" | "light";

/*
 * 色彩 token。auto 沿用部落格 tokens.css（淺色 stone、深色 zinc），
 * dark／light 沿用簡報裝置外框的固定色。
 */
const lightVars =
  "[--wf-surface:#ffffff] [--wf-raised:#f5f5f5] [--wf-sunken:#f3f1ed] [--wf-fg:#171717] [--wf-fg-body:#262626] [--wf-fg-muted:#525252] [--wf-line:rgba(28,25,23,0.1)] [--wf-line-strong:rgba(28,25,23,0.22)] [--wf-dot:rgba(28,25,23,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] [--wf-brand:rgba(217,119,6,0.7)] [--wf-shadow:0_1px_2px_rgba(28,25,23,0.05),0_4px_14px_-6px_rgba(28,25,23,0.08)]";
const darkAutoVars =
  "dark:[--wf-surface:#111113] dark:[--wf-raised:#1a1a1d] dark:[--wf-sunken:#161619] dark:[--wf-fg:#fafafa] dark:[--wf-fg-body:#e4e4e7] dark:[--wf-fg-muted:#e4e4e7] dark:[--wf-line:rgba(255,255,255,0.1)] dark:[--wf-line-strong:rgba(255,255,255,0.22)] dark:[--wf-dot:rgba(250,250,250,0.08)] dark:[--wf-success:rgba(52,211,153,0.6)] dark:[--wf-danger:rgba(248,113,113,0.6)] dark:[--wf-brand:rgba(250,204,21,0.7)] dark:[--wf-shadow:none]";
const fixedDark =
  "[--wf-surface:#151518] [--wf-raised:#1c1c20] [--wf-sunken:#1c1c20] [--wf-fg:#f4f4f4] [--wf-fg-body:#f4f4f4] [--wf-fg-muted:#bdb6a6] [--wf-line:#3a3a42] [--wf-line-strong:#3a3a42] [--wf-dot:rgba(246,241,230,0.08)] [--wf-success:rgba(52,211,153,0.6)] [--wf-danger:rgba(248,113,113,0.6)] [--wf-brand:rgba(232,184,74,0.7)] [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)]";
const fixedLight =
  "[--wf-surface:#ffffff] [--wf-raised:#e8e0cf] [--wf-sunken:#f4efe4] [--wf-fg:#17140d] [--wf-fg-body:#17140d] [--wf-fg-muted:#58513f] [--wf-line:#cfc6ae] [--wf-line-strong:#cfc6ae] [--wf-dot:rgba(23,20,13,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] [--wf-brand:rgba(138,90,0,0.7)] [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)]";

const schemeVars: Record<PhoneFrameScheme, string> = {
  auto: `${lightVars} ${darkAutoVars}`,
  dark: fixedDark,
  light: fixedLight,
};

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

/* ───────── 手機 ───────── */

export interface PhoneFrameProps {
  children: ReactNode;
  /** 瀏覽器網址列；不給就沒有網址列 */
  url?: string;
  time?: string;
  /** 手機寬度（px），窄容器裡會縮到 100% */
  width?: number;
  /** 手機整體高度。給了就固定大小，內容在螢幕裡捲動 */
  height?: number;
  /** 手機上方的小標 */
  label?: ReactNode;
  scheme?: PhoneFrameScheme;
  badge?: ReactNode;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<PhoneFrameLabels>;
  className?: string;
}

export interface PhoneFrameLabels {
  /** label 不是字串時 figure 的無障礙名稱 */
  screen: string;
  url: (url: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, PhoneFrameLabels> = {
  en: { screen: "Phone screen", url: (u) => `URL ${u}` },
  "zh-TW": { screen: "手機畫面", url: (u) => `網址 ${u}` },
  "zh-CN": { screen: "手机画面", url: (u) => `网址 ${u}` },
  ja: { screen: "スマートフォンの画面", url: (u) => `URL ${u}` },
};

export function PhoneFrame({
  children,
  url,
  time = "20:41",
  width = 320,
  height,
  label,
  scheme = "auto",
  badge,
  locale = "en",
  labels,
  className,
}: PhoneFrameProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  // 窄手機框：動態島縮小、狀態列收緊，不蓋到時間與電量
  const compact = width < 240;
  const part = "bg-[var(--wf-surface)] text-[var(--wf-fg)]";
  return (
    <figure
      aria-label={typeof label === "string" ? label : t.screen}
      className={cn(
        "m-0 grid min-w-0 max-w-full justify-items-center gap-2",
        schemeVars[scheme],
        className,
      )}
      style={{ width }}
    >
      {(label || badge) && (
        <figcaption className="flex items-center justify-center gap-2 text-[12.5px] text-[var(--wf-fg-muted)]">
          {label && <span>{label}</span>}
          {badge && <SimBadge>{badge}</SimBadge>}
        </figcaption>
      )}
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-[38px] bg-[#0b0b0d] p-2.5 shadow-[0_0_0_1.5px_color-mix(in_srgb,var(--wf-fg)_22%,transparent),0_18px_40px_rgba(0,0,0,0.35)]"
        style={height ? { height } : undefined}
      >
        <div
          aria-hidden="true"
          className="absolute top-4 left-1/2 z-[2] h-5 w-[76px] -translate-x-1/2 rounded-full bg-[#0b0b0d]"
          style={compact ? { width: 34, height: 12, top: 13 } : undefined}
        />
        <div
          aria-hidden="true"
          className={cn(
            "flex flex-none items-center justify-between rounded-t-[28px] px-5 pt-2 pb-1.5 text-[12.5px] font-bold",
            part,
          )}
          style={
            compact ? { padding: "7px 10px 4px", fontSize: 11 } : undefined
          }
        >
          <span className="tabular-nums">{time}</span>
          <span className="inline-flex items-center gap-1">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
            </svg>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0" />
            </svg>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
              <path d="M22 11v2" />
            </svg>
          </span>
        </div>
        {url && (
          <div
            aria-label={t.url(url)}
            className="flex flex-none items-center gap-1.5 border-b border-[var(--wf-line-strong)] bg-[var(--wf-raised)] px-3.5 py-1.5 text-xs text-[var(--wf-fg-muted)]"
          >
            <LockIcon size={11} />
            <span className="truncate text-[var(--wf-fg)]">{url}</span>
          </div>
        )}
        <div
          className={cn(
            "min-h-[120px] flex-auto overflow-x-hidden",
            part,
            height && "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          )}
        >
          {children}
        </div>
        <div
          aria-hidden="true"
          className={cn("relative h-[22px] flex-none rounded-b-[28px]", part)}
        >
          <span className="absolute bottom-[7px] left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-[var(--wf-fg)] opacity-45" />
        </div>
      </div>
    </figure>
  );
}
