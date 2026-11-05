"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

export interface RecapMonthData {
  /** 0 到 11 */
  monthIndex: number;
  /** 該月發文數 */
  count: number;
  /** monthNames 沒有對應時的備用名稱 */
  month?: string;
}

export interface RecapMonthLabels {
  title: string;
  posts: string;
  comments: { low: string; medium: string; high: string };
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const zhMonths = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

const MESSAGES: Record<SunLocale, RecapMonthLabels & { months: string[] }> = {
  en: {
    title: "Most Active Month",
    posts: "posts",
    comments: {
      low: "You were quieter this month",
      medium: "You were very active this month",
      high: "You were super active this month!",
    },
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
  "zh-TW": {
    title: "最活躍的月份",
    posts: "則貼文",
    comments: {
      low: "這個月你比較安靜",
      medium: "這個月你非常活躍",
      high: "這個月你超級活躍！",
    },
    months: zhMonths,
  },
  "zh-CN": {
    title: "最活跃的月份",
    posts: "条动态",
    comments: {
      low: "这个月你比较安静",
      medium: "这个月你非常活跃",
      high: "这个月你超级活跃！",
    },
    months: zhMonths,
  },
  ja: {
    title: "いちばん活発だった月",
    posts: "件の投稿",
    comments: {
      low: "今月はちょっと静かでした",
      medium: "今月はとても活発でした",
      high: "今月は大活躍でした！",
    },
    months: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
  },
};

/** 英文月份名稱（向下相容的匯出） */
export const recapMonthNames = MESSAGES.en.months;

/** 英文預設字串（向下相容的匯出） */
export const recapMonthLabels: RecapMonthLabels = {
  title: MESSAGES.en.title,
  posts: MESSAGES.en.posts,
  comments: MESSAGES.en.comments,
};

export interface RecapActiveMonthProps {
  data: RecapMonthData;
  /** 12 個月份名稱，預設依 locale */
  monthNames?: string[];
  /** 唯一強調色（當月格子與數字底線），預設琥珀金 #d4a24c */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapMonthLabels, "comments">> & { comments?: Partial<RecapMonthLabels["comments"]> };
  className?: string;
}

const EASE = [0.23, 1, 0.32, 1] as const;
const allMonths = Array.from({ length: 12 }, (_, i) => i);

/**
 * 年度回顧的「最活躍月份」：雜誌式的暗色版面，月份名稱與發文數用大號襯線字，
 * 下方 12 格月份條標出是哪一個月。只有一次整體淡入，沒有常駐動態。
 */
export function RecapActiveMonth({ data, monthNames: monthNamesProp, accent = "#d4a24c", locale = "en", labels, className }: RecapActiveMonthProps) {
  const reduce = useReducedMotion() ?? false;
  const tr = (t: Transition): Transition => (reduce ? { duration: 0 } : t);
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, comments: { ...base.comments, ...labels?.comments } };
  const monthNames = monthNamesProp ?? base.months;

  const monthData = data ?? { month: "", monthIndex: 0, count: 0 };
  const monthName = monthNames[monthData.monthIndex] || monthData.month || monthNames[0] || base.months[0];

  // 根據發佈數量產生評論
  const comment = monthData.count < 5 ? l.comments.low : monthData.count < 15 ? l.comments.medium : l.comments.high;

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
          <div className="font-serif text-5xl leading-[1.02] tracking-[-0.02em] break-words @md:text-6xl">{monthName}</div>
          <div className="mt-5 flex items-baseline gap-2.5">
            <span className="font-serif text-6xl leading-none tabular-nums lining-nums @md:text-7xl">{monthData.count}</span>
            <span className="text-base text-[#a8a29e] @md:text-lg">{l.posts}</span>
          </div>
          <div className="mt-3 h-px w-12" style={{ background: accent }} />

          {/* 12 格月份條：當月用強調色 */}
          <div aria-hidden className="mt-10 grid grid-cols-12 gap-1">
            {allMonths.map((i) => (
              <div
                key={i}
                className="h-6 rounded-[2px]"
                style={{ background: i === monthData.monthIndex ? accent : "rgb(255 255 255 / 0.08)" }}
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
