import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BrowserFrameTone = "default" | "danger" | "success" | "brand";
/** auto 跟著深淺色切換；dark／light 固定色，給不吃主題的簡報舞台用 */
export type BrowserFrameScheme = "auto" | "dark" | "light";
/** 視窗版（WindowFrame）與瀏覽器版共用同一組色調與配色 */
export type WindowFrameTone = BrowserFrameTone;
export type WindowFrameScheme = BrowserFrameScheme;

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
export function TrafficLights({ className }: { className?: string }) {
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

/** 兩種外框共用的殼：圓角、配色變數、色調外框 */
function frameShell(scheme: BrowserFrameScheme, tone: BrowserFrameTone, className?: string) {
  return cn(
    "m-0 min-w-0 overflow-hidden rounded-xl border bg-[var(--wf-surface)] transition-colors",
    schemeVars[scheme],
    toneRing[tone],
    className,
  );
}

/** 內容區，有 maxHeight 時在框內捲動 */
function FrameBody({ maxHeight, className, children }: { maxHeight?: number; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
      {children}
    </div>
  );
}

/* ───────── 電腦瀏覽器 ───────── */

export interface BrowserFrameLabels {
  /** 外框的無障礙名稱 */
  window: (url: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, BrowserFrameLabels> = {
  en: { window: (url) => `Browser window, ${url}` },
  "zh-TW": { window: (url) => `瀏覽器視窗，${url}` },
  "zh-CN": { window: (url) => `浏览器窗口，${url}` },
  ja: { window: (url) => `ブラウザウィンドウ、${url}` },
};

export interface BrowserFrameProps {
  /** 網址列（只顯示網域與路徑） */
  url: string;
  /** 分頁標題，不給就顯示網址 */
  title?: ReactNode;
  tone?: BrowserFrameTone;
  scheme?: BrowserFrameScheme;
  badge?: ReactNode;
  maxHeight?: number;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<BrowserFrameLabels>;
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
  locale = "en",
  labels,
  children,
  className,
}: BrowserFrameProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <figure
      aria-label={t.window(url)}
      className={frameShell(
        scheme,
        tone,
        cn("text-[var(--wf-fg)] shadow-[0_12px_30px_rgba(0,0,0,0.22)]", className),
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
      <FrameBody maxHeight={maxHeight} className="min-h-[120px]">
        {children}
      </FrameBody>
    </figure>
  );
}

/* ───────── macOS 視窗（原 window-frame） ───────── */

export interface WindowFrameProps {
  /** 標題列置中的文字（檔名、App 名稱） */
  title: ReactNode;
  /** 標題前的小圖示 */
  icon?: ReactNode;
  /** 標題列右側插槽 */
  right?: ReactNode;
  /** 標題列下方的選單列（窄螢幕隱藏） */
  menus?: string[];
  /** 外框顏色表示示範狀態：失敗、成功、品牌 */
  tone?: WindowFrameTone;
  scheme?: WindowFrameScheme;
  /** 有給就在右上角掛小徽章，例如「Simulated」，表示畫面是程式畫的 */
  badge?: ReactNode;
  /** 內容區最大高度，超過在框內捲動 */
  maxHeight?: number;
  children: ReactNode;
  className?: string;
}

/** 像編輯器或 App 的視窗外框：標題置中，沒有網址列 */
export function WindowFrame({
  title,
  icon,
  right,
  menus,
  tone = "default",
  scheme = "auto",
  badge,
  maxHeight,
  children,
  className,
}: WindowFrameProps) {
  return (
    <div className={frameShell(scheme, tone, cn("text-[var(--wf-fg-body)] shadow-[var(--wf-shadow)]", className))}>
      <div className="flex h-9 items-center gap-2 border-b border-[var(--wf-line)] bg-[var(--wf-raised)] px-3">
        <TrafficLights />
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate font-mono text-[11px] font-semibold text-[var(--wf-fg-body)]">
          {icon && (
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[var(--wf-fg)] [&>svg]:h-3.5 [&>svg]:w-3.5">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        <span className="flex min-w-[42px] items-center justify-end gap-2">
          {badge && <SimBadge>{badge}</SimBadge>}
          {right}
        </span>
      </div>
      {menus && menus.length > 0 && (
        <div
          aria-hidden="true"
          className="hidden gap-4 border-b border-[var(--wf-line)] px-3 py-1.5 text-[11px] text-[var(--wf-fg-muted)] sm:flex"
        >
          {menus.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
      <FrameBody maxHeight={maxHeight}>{children}</FrameBody>
    </div>
  );
}

/* ───────── 展示區 ───────── */

export interface StageProps {
  children: ReactNode;
  scheme?: BrowserFrameScheme;
  className?: string;
  style?: CSSProperties;
}

/** 帶點點底紋的展示區，放圖表、插圖與外框 */
export function Stage({ children, scheme = "auto", className, style }: StageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--wf-line)] bg-[var(--wf-sunken)]",
        schemeVars[scheme],
        className,
      )}
      style={{
        backgroundImage: "radial-gradient(var(--wf-dot) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
