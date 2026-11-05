"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface RecapKeyword {
  word: string;
  count: number;
}

export interface RecapKeywordCloudLabels {
  title: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, RecapKeywordCloudLabels> = {
  en: { title: "Top Keywords" },
  "zh-TW": { title: "年度關鍵字" },
  "zh-CN": { title: "年度关键词" },
  ja: { title: "よく使ったキーワード" },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const recapKeywordLabels: RecapKeywordCloudLabels = MESSAGES.en;

export interface RecapKeywordCloudProps {
  /** 關鍵字與出現次數，建議依次數由多到少排序 */
  keywords: RecapKeyword[];
  /** 唯一強調色（最常出現的那個字與 hover 底線），預設琥珀金 #d4a24c */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<RecapKeywordCloudLabels>;
  className?: string;
}

const EASE = [0.23, 1, 0.32, 1] as const;

// 根據頻率計算字體大小（@md 為容器寬度斷點）
function getFontSize(count: number, maxCount: number) {
  const ratio = count / maxCount;
  if (ratio > 0.8) return "text-5xl @md:text-6xl";
  if (ratio > 0.6) return "text-4xl @md:text-5xl";
  if (ratio > 0.4) return "text-3xl @md:text-4xl";
  if (ratio > 0.2) return "text-2xl @md:text-3xl";
  return "text-xl @md:text-2xl";
}

// 次數越少字越淡：只用同一個暖灰的深淺，最常出現的字才用強調色
function getTone(count: number, maxCount: number) {
  const ratio = count / maxCount;
  if (ratio > 0.6) return "#f5f5f4";
  if (ratio > 0.3) return "#d6d3d1";
  return "#a8a29e";
}

/**
 * 年度回顧的「關鍵字」：大小依出現次數的襯線字排成一段，像雜誌的拉頁引言。
 * 只有一次整體淡入；滑鼠移到字上時出現強調色底線。
 */
export function RecapKeywordCloud({ keywords, accent = "#d4a24c", locale = "en", labels, className }: RecapKeywordCloudProps) {
  const reduce = useReducedMotion() ?? false;
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const maxCount = Math.max(1, ...keywords.map((k) => k.count));

  return (
    <div
      className={cn("@container relative flex h-full w-full flex-col overflow-hidden p-6 @md:p-8", className)}
      style={{ backgroundColor: "#0c0a09", color: "#f5f5f4", ["--rk-accent" as string]: accent }}
    >
      <motion.div
        className="flex h-full flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
      >
        <h1 className="border-b pb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#a8a29e]" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
          {l.title}
        </h1>

        <ul className="m-0 flex flex-1 flex-wrap content-center items-baseline gap-x-4 gap-y-2 p-0 @md:gap-x-5">
          {keywords.map((keyword) => (
            <li
              key={keyword.word}
              className={cn(
                "cursor-default list-none font-serif leading-[1.1] tracking-[-0.01em] underline-offset-[6px] decoration-1 transition-[text-decoration-color] duration-200 hover:underline hover:decoration-[var(--rk-accent)]",
                getFontSize(keyword.count, maxCount),
              )}
              style={{ color: keyword.count === maxCount ? accent : getTone(keyword.count, maxCount) }}
            >
              {keyword.word}
              <sup className="ml-1 align-super font-sans text-[11px] font-medium tabular-nums text-[#a8a29e] @md:text-xs">{keyword.count}</sup>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
