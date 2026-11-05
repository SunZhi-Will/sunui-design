"use client";

import { cn } from "@/lib/utils";

/* ---------- Loading ---------- */

export interface LoadingStateProps {
  rows?: number;
  /** 無障礙名稱；不給時依 locale 用內建字串 */
  label?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<LoadingStateLabels>;
  className?: string;
}

export interface LoadingStateLabels {
  loading: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, LoadingStateLabels> = {
  en: { loading: "Loading" },
  "zh-TW": { loading: "載入中" },
  "zh-CN": { loading: "加载中" },
  ja: { loading: "読み込み中" },
};

export function LoadingState({ rows = 4, label, locale = "en", labels, className }: LoadingStateProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-label={label ?? t.loading}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      ))}
    </div>
  );
}
