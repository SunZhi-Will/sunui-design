"use client";

import { type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ───────── 圖示（形狀照 lucide） ───────── */

function Svg({
  size,
  children,
  style,
  className,
}: {
  size: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {children}
    </svg>
  );
}

const LockIcon = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Svg size={size} style={style}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

function ActionLink({
  href,
  onClick,
  className,
  style,
  children,
}: {
  href?: string;
  onClick?: () => void;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (href) {
    return (
      <a href={href} onClick={onClick} className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );
}

/* ───────── 試看上限的付費牆覆蓋層 ───────── */

export interface PreviewPaywallLabels {
  title?: ReactNode;
  body?: (previewCount: number) => ReactNode;
  cta?: ReactNode;
}

export interface PreviewPaywallProps {
  /** 免費試看的張數或集數 */
  previewCount: number;
  href?: string;
  onClick?: () => void;
  /** 按鈕底色；不傳時跟隨主題的 primary */
  ctaFrom?: string;
  /** 保留給相容舊版，按鈕不再做漸層，此值不使用 */
  ctaTo?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: PreviewPaywallLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<PreviewPaywallLabels>> = {
  en: {
    title: "Buy the course to keep watching",
    body: (n) => `You've previewed ${n} slide${n === 1 ? "" : "s"}. Buy the course to unlock everything.`,
    cta: "View course & buy",
  },
  "zh-TW": {
    title: "購買課程即可繼續觀看",
    body: (n) => `你已試看 ${n} 張投影片，購買課程即可解鎖全部內容。`,
    cta: "查看課程並購買",
  },
  "zh-CN": {
    title: "购买课程即可继续观看",
    body: (n) => `你已试看 ${n} 张幻灯片，购买课程即可解锁全部内容。`,
    cta: "查看课程并购买",
  },
  ja: {
    title: "続きを見るにはコースを購入",
    body: (n) => `${n} 枚のスライドを試し見しました。コースを購入するとすべてのコンテンツが見られます。`,
    cta: "コースを見て購入",
  },
};

/** 蓋在播放器上（父層要 relative），試看到最後一張時顯示 */
export function PreviewPaywall({
  previewCount,
  href,
  onClick,
  ctaFrom,
  locale = "en",
  labels,
  className,
}: PreviewPaywallProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <div
      role="region"
      aria-label={typeof l.title === "string" ? l.title : undefined}
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 px-4",
        className,
      )}
      style={{
        // 遮住後面被鎖的內容：同色的不透明遮罩加輕微模糊（功能性，不是裝飾）
        background:
          "linear-gradient(to top, var(--background) 60%, color-mix(in oklab, var(--background) 55%, transparent) 100%)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        <LockIcon size={18} />
      </div>
      <div className="text-center">
        <p className="mb-1 text-base font-semibold text-foreground sm:text-lg">{l.title}</p>
        <p className="text-sm text-muted-foreground">{l.body(previewCount)}</p>
      </div>
      <ActionLink
        href={href}
        onClick={onClick}
        className={cn(
          "rounded-md px-5 py-2.5 text-sm font-medium transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50",
          !ctaFrom && "bg-primary text-primary-foreground",
        )}
        style={ctaFrom ? { background: ctaFrom, color: "#fff" } : undefined}
      >
        {l.cta}
      </ActionLink>
    </div>
  );
}
