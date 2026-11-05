"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

export interface RecapStreakLabels {
  title: string;
  subtitle: string;
  /** 天數單位；給函式可依天數處理單複數 */
  days: string | ((n: number) => string);
  comments: { low: string; medium: string; high: string; veryHigh: string };
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, RecapStreakLabels> = {
  en: {
    title: "Posting Streak",
    subtitle: "Your longest streak was",
    days: (n) => (n === 1 ? "day" : "days"),
    comments: {
      low: "You like to post casually",
      medium: "You have a habit of posting regularly",
      high: "You are a persistent creator!",
      veryHigh: "You are a super persistent creator!",
    },
  },
  "zh-TW": {
    title: "連續發文",
    subtitle: "你最長的連續紀錄是",
    days: "天",
    comments: {
      low: "你喜歡隨興發文",
      medium: "你有固定發文的習慣",
      high: "你是一位堅持不懈的創作者！",
      veryHigh: "你是超級堅持的創作者！",
    },
  },
  "zh-CN": {
    title: "连续发帖",
    subtitle: "你最长的连续纪录是",
    days: "天",
    comments: {
      low: "你喜欢随性发帖",
      medium: "你有定期发帖的习惯",
      high: "你是一位坚持不懈的创作者！",
      veryHigh: "你是超级坚持的创作者！",
    },
  },
  ja: {
    title: "連続投稿",
    subtitle: "最長の連続記録は",
    days: "日",
    comments: {
      low: "気ままに投稿するタイプです",
      medium: "定期的に投稿する習慣があります",
      high: "粘り強いクリエイターです！",
      veryHigh: "超粘り強いクリエイターです！",
    },
  },
};

/** 英文預設字串（保留舊的匯出名稱） */
export const recapStreakLabels = MESSAGES.en;

export interface RecapStreakFlameProps {
  /** 最長連續發文天數 */
  streak: number;
  /** 唯一強調色（連續天數格子），預設琥珀金 #d4a24c */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapStreakLabels, "comments">> & { comments?: Partial<RecapStreakLabels["comments"]> };
  className?: string;
}

const EASE = [0.23, 1, 0.32, 1] as const;
/** 天數格子：四週 28 格，超過的話全部填滿 */
const GRID_DAYS = 28;

/**
 * 年度回顧的「連續發文」：大號襯線數字加一張四週的天數格，連續的天數用強調色填滿。
 * 只有一次整體淡入；天數改變時數字淡入替換，沒有火焰粒子或常駐動態。
 */
export function RecapStreakFlame({ streak: streakProp, accent = "#d4a24c", locale = "en", labels, className }: RecapStreakFlameProps) {
  const reduce = useReducedMotion() ?? false;
  const tr = (t: Transition): Transition => (reduce ? { duration: 0 } : t);
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, comments: { ...base.comments, ...labels?.comments } };
  const streak = streakProp ?? 0;
  const days = typeof l.days === "function" ? l.days(streak) : l.days;

  // 根據連續天數產生評論
  const comment =
    streak < 3 ? l.comments.low : streak < 7 ? l.comments.medium : streak < 14 ? l.comments.high : l.comments.veryHigh;

  return (
    <div
      className={cn("@container relative flex h-full w-full flex-col overflow-hidden p-6 @md:p-8", className)}
      style={{ backgroundColor: "#0c0a09", color: "#f5f5f4" }}
    >
      <motion.div
        className="flex h-full flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tr({ duration: 0.5, ease: EASE })}
      >
        <h1 className="border-b pb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#a8a29e]" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
          {l.title}
        </h1>

        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[15px] text-[#a8a29e] @md:text-base">{l.subtitle}</p>
          <div className="mt-2 flex items-baseline gap-3">
            <motion.span
              key={streak}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={tr({ duration: 0.3, ease: EASE })}
              className="font-serif text-8xl leading-none tracking-[-0.03em] tabular-nums lining-nums @md:text-9xl"
            >
              {streak}
            </motion.span>
            <span className="text-xl text-[#d6d3d1] @md:text-2xl">{days}</span>
          </div>

          {/* 四週天數格：連續的天數依序填滿 */}
          <div aria-hidden className="mt-8 grid grid-cols-7 gap-1.5">
            {Array.from({ length: GRID_DAYS }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-[3px]"
                style={{ background: i < streak ? accent : "rgb(255 255 255 / 0.08)" }}
              />
            ))}
          </div>
        </div>

        <p className="border-t pt-4 text-[15px] leading-relaxed text-[#d6d3d1] @md:text-base" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
          {comment}
        </p>
      </motion.div>
    </div>
  );
}
