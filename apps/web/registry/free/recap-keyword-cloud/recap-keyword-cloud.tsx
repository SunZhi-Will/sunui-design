"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<RecapKeywordCloudLabels>;
  className?: string;
}

// 根據頻率計算字體大小（@md 為容器寬度斷點）
function getFontSize(count: number, maxCount: number) {
  const ratio = count / maxCount;
  if (ratio > 0.8) return "text-4xl @md:text-5xl";
  if (ratio > 0.6) return "text-3xl @md:text-4xl";
  if (ratio > 0.4) return "text-2xl @md:text-3xl";
  if (ratio > 0.2) return "text-xl @md:text-2xl";
  return "text-lg @md:text-xl";
}

function getColor(count: number, maxCount: number) {
  const ratio = count / maxCount;
  if (ratio > 0.8) return "from-pink-400 to-fuchsia-400";
  if (ratio > 0.6) return "from-purple-400 to-pink-400";
  if (ratio > 0.4) return "from-violet-400 to-purple-400";
  if (ratio > 0.2) return "from-indigo-400 to-violet-400";
  return "from-blue-400 to-indigo-400";
}

export function RecapKeywordCloud({ keywords, locale = "en", labels, className }: RecapKeywordCloudProps) {
  const reduce = useReducedMotion() ?? false;
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const maxCount = Math.max(1, ...keywords.map((k) => k.count));

  // 每個字卡左右交錯傾斜 5 到 15 度，固定下來避免重新渲染時跳動
  const rotations = useMemo(
    () => keywords.map((_, index) => (index % 2 === 0 ? 1 : -1) * (Math.random() * 10 + 5)),
    [keywords],
  );

  return (
    <div
      className={cn(
        "@container relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-violet-950/30 via-purple-950/20 to-fuchsia-950/30 p-6",
        className,
      )}
      // 卡片原本的深色底，漸層疊在上面
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6 }}
        className="absolute top-6 right-0 left-0 z-10 mb-6 w-full text-center text-2xl font-bold text-white @md:text-3xl"
      >
        {l.title}
      </motion.h1>

      <ul className="relative z-10 mt-16 flex flex-wrap items-center justify-center gap-3 px-4 @md:gap-4">
        {keywords.map((keyword, index) => {
          const baseRotation = rotations[index] ?? 0;
          return (
            <motion.li
              key={keyword.word}
              initial={{ opacity: 0, scale: 0, rotate: baseRotation - 20 }}
              animate={{ opacity: 1, scale: 1, rotate: baseRotation, y: reduce ? 0 : [0, -10, 0] }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      delay: index * 0.15,
                      duration: 0.6,
                      type: "spring",
                      y: { duration: 2, repeat: Infinity, repeatType: "reverse", delay: index * 0.2 },
                    }
              }
              whileHover={reduce ? undefined : { scale: 1.1, rotate: baseRotation + 5 }}
              className={cn(
                "cursor-pointer list-none rounded-xl bg-gradient-to-br px-4 py-3 font-bold text-white shadow-lg backdrop-blur-sm",
                getFontSize(keyword.count, maxCount),
                getColor(keyword.count, maxCount),
              )}
            >
              {keyword.word}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={reduce ? { duration: 0 } : { delay: index * 0.15 + 0.3 }}
                className="ml-2 text-xs font-normal @md:text-sm"
              >
                {keyword.count}
              </motion.span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
