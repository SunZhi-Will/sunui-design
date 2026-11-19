"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------- Buttons (same as shadcn Button default and outline) ---------- */

const buttonBase =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const buttonVariant = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border-border bg-background hover:bg-muted hover:text-foreground",
};
const buttonSize = {
  default: "h-8 gap-1.5 px-2.5",
  sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
};

interface StateButtonProps extends Omit<ComponentProps<"button">, "type"> {
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
  /** When given, renders as a link */
  href?: string;
}

function StateButton({ variant = "default", size = "default", href, className, children, ...props }: StateButtonProps) {
  const cls = cn(buttonBase, buttonVariant[variant], buttonSize[size], className);
  if (href) {
    return (
      <a href={href} className={cls} onClick={props.onClick as ComponentProps<"a">["onClick"]}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

/* ---------- Error ---------- */

export interface ErrorStateLabels {
  title: ReactNode;
  message: ReactNode;
  retry: ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ErrorStateLabels> = {
  en: { title: "Couldn't load data", message: "Something went wrong. Please try again.", retry: "Retry" },
  "zh-TW": { title: "無法載入資料", message: "發生了一點問題，請再試一次。", retry: "重試" },
  "zh-CN": { title: "无法加载数据", message: "出了点问题，请重试。", retry: "重试" },
  ja: { title: "データを読み込めませんでした", message: "問題が発生しました。もう一度お試しください。", retry: "再試行" },
};

export interface ErrorStateProps {
  /** Falls back to the locale's default title when omitted */
  title?: ReactNode;
  /** A friendly message for users; do not pass raw exceptions or technical messages */
  message?: ReactNode;
  onRetry?: () => void;
  /** Replaces the default warning triangle, like the icon on EmptyState; any SVG is scaled to 24px */
  icon?: ReactNode;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: Partial<ErrorStateLabels>;
  className?: string;
}

export function ErrorState({ title, message, onRetry, icon, locale = "en", labels, className }: ErrorStateProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <div role="alert" className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card text-sm text-card-foreground", className)}>
      <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
        <span aria-hidden="true" className="text-destructive [&_svg]:size-6">
          {icon ?? <AlertTriangleIcon />}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{title ?? t.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message ?? t.message}</p>
        </div>
        {onRetry ? (
          <StateButton variant="outline" size="sm" onClick={onRetry}>
            {t.retry}
          </StateButton>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Icons (lucide shapes, 1.5 stroke width) ---------- */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function AlertTriangleIcon() {
  return (
    <svg {...iconProps}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
