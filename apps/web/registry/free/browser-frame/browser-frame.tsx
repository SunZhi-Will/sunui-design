import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BrowserFrameTone = "default" | "danger" | "success" | "brand";
/** auto follows light and dark; dark / light are fixed colors, for presentation stages that do not follow the theme */
export type BrowserFrameScheme = "auto" | "dark" | "light";
/** The window version (WindowFrame) and the browser version share the same tones and palette */
export type WindowFrameTone = BrowserFrameTone;
export type WindowFrameScheme = BrowserFrameScheme;

/*
 * Color tokens. auto reuses the blog's tokens.css (stone in light, zinc in dark),
 * dark / light reuse the fixed colors of the presentation device frames.
 */
const lightVars =
  "[--wf-surface:#ffffff] [--wf-raised:#f5f5f5] [--wf-sunken:#f3f1ed] [--wf-fg:#171717] [--wf-fg-body:#262626] [--wf-fg-muted:#525252] [--wf-line:rgba(28,25,23,0.1)] [--wf-line-strong:rgba(28,25,23,0.22)] [--wf-dot:rgba(28,25,23,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] [--wf-brand:rgba(217,119,6,0.7)] [--wf-shadow:0_1px_2px_rgba(28,25,23,0.05),0_4px_14px_-6px_rgba(28,25,23,0.08)]";
const darkAutoVars =
  "dark:[--wf-surface:#111113] dark:[--wf-raised:#1a1a1d] dark:[--wf-sunken:#161619] dark:[--wf-fg:#fafafa] dark:[--wf-fg-body:#e4e4e7] dark:[--wf-fg-muted:#e4e4e7] dark:[--wf-line:rgba(255,255,255,0.1)] dark:[--wf-line-strong:rgba(255,255,255,0.22)] dark:[--wf-dot:rgba(250,250,250,0.08)] dark:[--wf-success:rgba(52,211,153,0.6)] dark:[--wf-danger:rgba(248,113,113,0.6)] dark:[--wf-brand:rgba(250,204,21,0.7)] dark:[--wf-shadow:none]";
const fixedDark =
  "[--wf-surface:#151518] [--wf-raised:#1c1c20] [--wf-sunken:#1c1c20] [--wf-fg:#f4f4f4] [--wf-fg-body:#f4f4f4] [--wf-fg-muted:#bdb6a6] [--wf-line:#3a3a42] [--wf-line-strong:#3a3a42] [--wf-dot:rgba(246,241,230,0.08)] [--wf-success:rgba(52,211,153,0.6)] [--wf-danger:rgba(248,113,113,0.6)] [--wf-brand:rgba(232,184,74,0.7)] [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)]";
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

/** macOS red, yellow and green traffic lights */
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

/** Shell shared by both frames: rounded corners, color variables, tinted outline */
function frameShell(scheme: BrowserFrameScheme, tone: BrowserFrameTone, className?: string) {
  return cn(
    "m-0 min-w-0 overflow-hidden rounded-xl border bg-[var(--wf-surface)] transition-colors",
    schemeVars[scheme],
    toneRing[tone],
    className,
  );
}

/** Content area, scrolls inside the frame when maxHeight is set */
function FrameBody({ maxHeight, className, children }: { maxHeight?: number; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
      {children}
    </div>
  );
}

/* ───────── Desktop browser ───────── */

export interface BrowserFrameLabels {
  /** Accessible name of the frame */
  window: (url: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
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
  /** Address bar (shows only the domain and path) */
  url: string;
  /** Tab title; shows the URL when not given */
  title?: ReactNode;
  tone?: BrowserFrameTone;
  scheme?: BrowserFrameScheme;
  badge?: ReactNode;
  maxHeight?: number;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings, takes priority over locale */
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

/* ───────── macOS window (formerly window-frame) ───────── */

export interface WindowFrameProps {
  /** Centered text in the title bar (file name, app name) */
  title: ReactNode;
  /** Small icon before the title */
  icon?: ReactNode;
  /** Slot on the right of the title bar */
  right?: ReactNode;
  /** Menu bar below the title bar (hidden on narrow screens) */
  menus?: string[];
  /** Outline color for demo states: failed, success, brand */
  tone?: WindowFrameTone;
  scheme?: WindowFrameScheme;
  /** When given, a small badge hangs at the top right, for example "Simulated", showing the picture is drawn by code */
  badge?: ReactNode;
  /** Maximum height of the content area, scrolls inside the frame beyond that */
  maxHeight?: number;
  children: ReactNode;
  className?: string;
}

/** Window frame like an editor or app: centered title, no address bar */
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

/* ───────── Showcase area ───────── */

export interface StageProps {
  children: ReactNode;
  scheme?: BrowserFrameScheme;
  className?: string;
  style?: CSSProperties;
}

/** Showcase area with a dotted pattern, for charts, illustrations and frames */
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
