"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useMemo, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { resolveLocale, type SunLocale } from "./story-player";

/* ------------------------------------------------------------------ */
/* 共用：暗色雜誌風的色票、緩動與外框                                     */
/* ------------------------------------------------------------------ */

/** 年度回顧投影片的暗色色票（showcase 系列）。accent 只是預設值，各元件都能用 accent prop 換掉。 */
export const recapPalette = {
  base: "#0c0a09",
  surface: "#161412",
  line: "rgb(255 255 255 / 0.08)",
  text: "#f5f5f4",
  soft: "#d6d3d1",
  muted: "#a8a29e",
  accent: "#d4a24c",
} as const;

const EASE = [0.23, 1, 0.32, 1] as const;

/** reduced motion 時把所有過場改成 0 秒 */
function useRecapTransition() {
  const reduce = useReducedMotion() ?? false;
  return (t: Transition): Transition => (reduce ? { duration: 0 } : t);
}

export interface RecapFrameProps {
  /** 頂端的小標，下方有一道細線 */
  title: ReactNode;
  /** 底部的一句話，上方有一道細線 */
  footer?: ReactNode;
  /** 唯一強調色，會寫進 --recap-accent 變數 */
  accent?: string;
  className?: string;
  style?: CSSProperties;
  /** 中段內容，請自己加上 flex-1 撐滿 */
  children: ReactNode;
}

/**
 * 四張回顧投影片共用的外框：#0c0a09 底、上方小標、下方一句話，整體淡入一次。
 * 自己做封面或結尾張時也可以直接用它，版面就會跟其他張一致。
 */
export function RecapFrame({ title, footer, accent = recapPalette.accent, className, style, children }: RecapFrameProps) {
  const tr = useRecapTransition();
  return (
    <div
      className={cn("@container relative flex h-full w-full flex-col overflow-hidden p-6 @md:p-8", className)}
      style={{ backgroundColor: recapPalette.base, color: recapPalette.text, ["--recap-accent" as string]: accent, ...style }}
    >
      <motion.div
        className="flex h-full min-h-0 flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tr({ duration: 0.5, ease: EASE })}
      >
        <h2
          className="border-b pb-3 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ borderColor: recapPalette.line, color: recapPalette.muted }}
        >
          {title}
        </h2>
        {children}
        {footer != null && (
          <div className="border-t pt-4" style={{ borderColor: recapPalette.line }}>
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function FooterLine({ children, tone = recapPalette.soft }: { children: ReactNode; tone?: string }) {
  return (
    <p className="text-[15px] leading-relaxed @md:text-base" style={{ color: tone }}>
      {children}
    </p>
  );
}

/** 共用的 props：強調色、語言、class */
interface RecapBaseProps {
  /** 唯一強調色，預設琥珀金 #d4a24c */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* 最活躍的月份                                                          */
/* ------------------------------------------------------------------ */

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

const zhMonths = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

const MONTH_MESSAGES: Record<SunLocale, RecapMonthLabels & { months: string[] }> = {
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
    comments: { low: "這個月你比較安靜", medium: "這個月你非常活躍", high: "這個月你超級活躍！" },
    months: zhMonths,
  },
  "zh-CN": {
    title: "最活跃的月份",
    posts: "条动态",
    comments: { low: "这个月你比较安静", medium: "这个月你非常活跃", high: "这个月你超级活跃！" },
    months: zhMonths,
  },
  ja: {
    title: "いちばん活発だった月",
    posts: "件の投稿",
    comments: { low: "今月はちょっと静かでした", medium: "今月はとても活発でした", high: "今月は大活躍でした！" },
    months: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
  },
};

/** 英文月份名稱（向下相容的匯出） */
export const recapMonthNames = MONTH_MESSAGES.en.months;

/** 英文預設字串（向下相容的匯出） */
export const recapMonthLabels: RecapMonthLabels = {
  title: MONTH_MESSAGES.en.title,
  posts: MONTH_MESSAGES.en.posts,
  comments: MONTH_MESSAGES.en.comments,
};

export interface RecapActiveMonthProps extends RecapBaseProps {
  data: RecapMonthData;
  /** 12 個月份名稱，預設依 locale */
  monthNames?: string[];
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapMonthLabels, "comments">> & { comments?: Partial<RecapMonthLabels["comments"]> };
}

const allMonths = Array.from({ length: 12 }, (_, i) => i);

/**
 * 「最活躍月份」：月份名稱與發文數用大號襯線字，下方 12 格月份條用強調色標出是哪一個月。
 */
export function RecapActiveMonth({ data, monthNames: monthNamesProp, accent = recapPalette.accent, locale = "en", labels, className }: RecapActiveMonthProps) {
  const base = MONTH_MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, comments: { ...base.comments, ...labels?.comments } };
  const monthNames = monthNamesProp ?? base.months;

  const monthData = data ?? { month: "", monthIndex: 0, count: 0 };
  const monthName = monthNames[monthData.monthIndex] || monthData.month || monthNames[0] || base.months[0];

  // 根據發佈數量產生評論
  const comment = monthData.count < 5 ? l.comments.low : monthData.count < 15 ? l.comments.medium : l.comments.high;

  return (
    <RecapFrame title={l.title} accent={accent} className={className} footer={<FooterLine>{comment}</FooterLine>}>
      <div className="flex flex-1 flex-col justify-center">
        <div className="font-serif text-5xl leading-[1.02] tracking-[-0.02em] break-words @md:text-6xl">{monthName}</div>
        <div className="mt-5 flex items-baseline gap-2.5">
          <span className="font-serif text-6xl leading-none tabular-nums lining-nums @md:text-7xl">{monthData.count}</span>
          <span className="text-base @md:text-lg" style={{ color: recapPalette.muted }}>
            {l.posts}
          </span>
        </div>
        <div className="mt-3 h-px w-12" style={{ background: accent }} />

        {/* 12 格月份條：當月用強調色 */}
        <div aria-hidden className="mt-10 grid grid-cols-12 gap-1">
          {allMonths.map((i) => (
            <div key={i} className="h-6 rounded-[2px]" style={{ background: i === monthData.monthIndex ? accent : recapPalette.line }} />
          ))}
        </div>
      </div>
    </RecapFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 年度關鍵字                                                            */
/* ------------------------------------------------------------------ */

export interface RecapKeyword {
  word: string;
  count: number;
}

export interface RecapKeywordCloudLabels {
  title: string;
}

const KEYWORD_MESSAGES: Record<SunLocale, RecapKeywordCloudLabels> = {
  en: { title: "Top Keywords" },
  "zh-TW": { title: "年度關鍵字" },
  "zh-CN": { title: "年度关键词" },
  ja: { title: "よく使ったキーワード" },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const recapKeywordLabels: RecapKeywordCloudLabels = KEYWORD_MESSAGES.en;

export interface RecapKeywordCloudProps extends RecapBaseProps {
  /** 關鍵字與出現次數，建議依次數由多到少排序 */
  keywords: RecapKeyword[];
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<RecapKeywordCloudLabels>;
}

// 根據頻率計算字體大小（@md 為容器寬度斷點）
function keywordSize(ratio: number) {
  if (ratio > 0.8) return "text-5xl @md:text-6xl";
  if (ratio > 0.6) return "text-4xl @md:text-5xl";
  if (ratio > 0.4) return "text-3xl @md:text-4xl";
  if (ratio > 0.2) return "text-2xl @md:text-3xl";
  return "text-xl @md:text-2xl";
}

// 次數越少字越淡：只用同一個暖灰的深淺，最常出現的字才用強調色
function keywordTone(ratio: number) {
  if (ratio > 0.6) return recapPalette.text;
  if (ratio > 0.3) return recapPalette.soft;
  return recapPalette.muted;
}

/**
 * 「年度關鍵字」：大小依出現次數的襯線字排成一段，像雜誌的拉頁引言；滑鼠移到字上時出現強調色底線。
 */
export function RecapKeywordCloud({ keywords, accent = recapPalette.accent, locale = "en", labels, className }: RecapKeywordCloudProps) {
  const l = { ...KEYWORD_MESSAGES[resolveLocale(locale)], ...labels };
  const maxCount = Math.max(1, ...keywords.map((k) => k.count));

  return (
    <RecapFrame title={l.title} accent={accent} className={className}>
      <ul className="m-0 flex flex-1 flex-wrap content-center items-baseline gap-x-4 gap-y-2 p-0 @md:gap-x-5">
        {keywords.map((keyword) => {
          const ratio = keyword.count / maxCount;
          return (
            <li
              key={keyword.word}
              className={cn(
                "cursor-default list-none font-serif leading-[1.1] tracking-[-0.01em] underline-offset-[6px] decoration-1 transition-[text-decoration-color] duration-200 hover:underline hover:decoration-[var(--recap-accent)]",
                keywordSize(ratio),
              )}
              style={{ color: keyword.count === maxCount ? accent : keywordTone(ratio) }}
            >
              {keyword.word}
              <sup className="ml-1 align-super font-sans text-[11px] font-medium tabular-nums @md:text-xs" style={{ color: recapPalette.muted }}>
                {keyword.count}
              </sup>
            </li>
          );
        })}
      </ul>
    </RecapFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 百分位排名                                                            */
/* ------------------------------------------------------------------ */

export type RecapRankLevel = "top01" | "top1" | "top5" | "top10" | "top25" | "top50" | "unknown";

export interface RecapPercentileLabels {
  title: string;
  subtitle: string;
  noData: string;
  /** 沒有排名資料時大字顯示的內容 */
  notAvailable: string;
  levels: Record<RecapRankLevel, string>;
}

const PERCENTILE_MESSAGES: Record<SunLocale, RecapPercentileLabels> = {
  en: {
    title: "Percentile Rank",
    subtitle: "Top",
    noData: "Ranking data requires comparison with other users to calculate",
    notAvailable: "N/A",
    levels: {
      top01: "Top 0.1% Creator",
      top1: "Top 1% Creator",
      top5: "Top 5% Creator",
      top10: "Top 10% Creator",
      top25: "Top 25% Creator",
      top50: "Top 50% Creator",
      unknown: "Calculating Rank",
    },
  },
  "zh-TW": {
    title: "百分位排名",
    subtitle: "頂尖",
    noData: "排名需要與其他使用者比較後才能計算",
    notAvailable: "無",
    levels: {
      top01: "前 0.1% 創作者",
      top1: "前 1% 創作者",
      top5: "前 5% 創作者",
      top10: "前 10% 創作者",
      top25: "前 25% 創作者",
      top50: "前 50% 創作者",
      unknown: "排名計算中",
    },
  },
  "zh-CN": {
    title: "百分位排名",
    subtitle: "顶尖",
    noData: "排名需要与其他用户比较后才能计算",
    notAvailable: "无",
    levels: {
      top01: "前 0.1% 创作者",
      top1: "前 1% 创作者",
      top5: "前 5% 创作者",
      top10: "前 10% 创作者",
      top25: "前 25% 创作者",
      top50: "前 50% 创作者",
      unknown: "排名计算中",
    },
  },
  ja: {
    title: "パーセンタイル順位",
    subtitle: "上位",
    noData: "ランキングの算出には、ほかのユーザーとの比較データが必要です",
    notAvailable: "なし",
    levels: {
      top01: "上位 0.1% のクリエイター",
      top1: "上位 1% のクリエイター",
      top5: "上位 5% のクリエイター",
      top10: "上位 10% のクリエイター",
      top25: "上位 25% のクリエイター",
      top50: "上位 50% のクリエイター",
      unknown: "順位を計算中",
    },
  },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const recapPercentileLabels = PERCENTILE_MESSAGES.en;

export interface RecapPercentileRingProps extends RecapBaseProps {
  /** 排名百分比（越小越好），null 代表沒有可比較的資料 */
  percentileRank: number | null;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapPercentileLabels, "levels">> & { levels?: Partial<Record<RecapRankLevel, string>> };
}

/** 格式化排名百分比顯示 */
export function formatPercentile(rank: number | null): string {
  if (rank === null || rank === undefined) return "N/A";
  if (rank < 0.01) return "0.01"; // 最小顯示 0.01%
  if (rank < 1) return rank.toFixed(2); // 小於 1% 顯示兩位小數
  if (rank < 10) return rank.toFixed(1); // 1 到 10% 顯示一位小數
  return Math.round(rank).toString(); // 大於 10% 顯示整數
}

/**
 * 根據排名百分比取得等級。
 * color 與 glow 為舊版 API 保留的欄位，元件本身已不使用，一律回傳中性值。
 */
export function getRankLevel(rank: number | null): { level: RecapRankLevel; color: string; glow: string } {
  const neutral = { color: "from-stone-400 to-stone-300", glow: "transparent" };
  if (rank === null || rank === undefined) return { level: "unknown", ...neutral };
  if (rank <= 0.1) return { level: "top01", ...neutral };
  if (rank <= 1) return { level: "top1", ...neutral };
  if (rank <= 5) return { level: "top5", ...neutral };
  if (rank <= 10) return { level: "top10", ...neutral };
  if (rank <= 25) return { level: "top25", ...neutral };
  return { level: "top50", ...neutral };
}

/**
 * 「百分位排名」：100 個刻度點排成一圈，填滿 100 減排名的數量；圈中央是大號襯線數字。
 */
export function RecapPercentileRing({ percentileRank, accent = recapPalette.accent, locale = "en", labels, className }: RecapPercentileRingProps) {
  const base = PERCENTILE_MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, levels: { ...base.levels, ...labels?.levels } };

  const rank = percentileRank ?? null;
  const displayValue = formatPercentile(rank);
  const rankLevel = getRankLevel(rank);

  // 生成圓形刻度點（排名百分比越低越好，所以用 100 - rank）
  const progressDots = useMemo(() => {
    const totalDots = 100;
    const activeDots = rank !== null ? Math.round(100 - rank) : 0;
    return Array.from({ length: totalDots }, (_, i) => ({ id: i, angle: (i / totalDots) * 360, isActive: i < activeDots }));
  }, [rank]);

  const footer =
    rank !== null ? (
      <p className="flex items-center gap-2 text-[15px] font-medium @md:text-base" style={{ color: recapPalette.text }}>
        <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: accent }} />
        {l.levels[rankLevel.level]}
      </p>
    ) : (
      <FooterLine tone={recapPalette.muted}>{l.noData}</FooterLine>
    );

  return (
    <RecapFrame title={l.title} accent={accent} className={className} footer={footer}>
      <div className="relative flex flex-1 items-center justify-center">
        {/* 刻度圈 */}
        <svg aria-hidden className="absolute aspect-square w-full max-w-[22rem]" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
          {progressDots.map((dot) => {
            const radian = (dot.angle * Math.PI) / 180;
            return (
              <circle
                key={dot.id}
                cx={100 + Math.cos(radian) * 88}
                cy={100 + Math.sin(radian) * 88}
                r={dot.isActive ? 1.6 : 1}
                fill={dot.isActive ? accent : "rgb(255 255 255 / 0.16)"}
              />
            );
          })}
        </svg>

        <div className="relative text-center">
          {rank !== null && (
            <div className="mb-1 text-sm font-medium uppercase tracking-[0.14em]" style={{ color: recapPalette.muted }}>
              {l.subtitle}
            </div>
          )}
          <div className="font-serif text-7xl leading-none tracking-[-0.03em] tabular-nums lining-nums @md:text-8xl">
            {rank !== null ? (
              <>
                {displayValue}
                <span className="ml-0.5 align-top text-[0.45em]" style={{ color: recapPalette.muted }}>
                  %
                </span>
              </>
            ) : (
              l.notAvailable
            )}
          </div>
        </div>
      </div>
    </RecapFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 連續發文                                                              */
/* ------------------------------------------------------------------ */

export interface RecapStreakLabels {
  title: string;
  subtitle: string;
  /** 天數單位；給函式可依天數處理單複數 */
  days: string | ((n: number) => string);
  comments: { low: string; medium: string; high: string; veryHigh: string };
}

const STREAK_MESSAGES: Record<SunLocale, RecapStreakLabels> = {
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
    comments: { low: "你喜歡隨興發文", medium: "你有固定發文的習慣", high: "你是一位堅持不懈的創作者！", veryHigh: "你是超級堅持的創作者！" },
  },
  "zh-CN": {
    title: "连续发帖",
    subtitle: "你最长的连续纪录是",
    days: "天",
    comments: { low: "你喜欢随性发帖", medium: "你有定期发帖的习惯", high: "你是一位坚持不懈的创作者！", veryHigh: "你是超级坚持的创作者！" },
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
export const recapStreakLabels = STREAK_MESSAGES.en;

export interface RecapStreakFlameProps extends RecapBaseProps {
  /** 最長連續發文天數 */
  streak: number;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapStreakLabels, "comments">> & { comments?: Partial<RecapStreakLabels["comments"]> };
}

/** 天數格子：四週 28 格，超過的話全部填滿 */
const GRID_DAYS = 28;

/**
 * 「連續發文」：大號襯線數字加一張四週的天數格，連續的天數用強調色填滿；天數改變時數字淡入替換。
 */
export function RecapStreakFlame({ streak: streakProp, accent = recapPalette.accent, locale = "en", labels, className }: RecapStreakFlameProps) {
  const tr = useRecapTransition();
  const base = STREAK_MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, comments: { ...base.comments, ...labels?.comments } };
  const streak = streakProp ?? 0;
  const days = typeof l.days === "function" ? l.days(streak) : l.days;

  // 根據連續天數產生評論
  const comment = streak < 3 ? l.comments.low : streak < 7 ? l.comments.medium : streak < 14 ? l.comments.high : l.comments.veryHigh;

  return (
    <RecapFrame title={l.title} accent={accent} className={className} footer={<FooterLine>{comment}</FooterLine>}>
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-[15px] @md:text-base" style={{ color: recapPalette.muted }}>
          {l.subtitle}
        </p>
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
          <span className="text-xl @md:text-2xl" style={{ color: recapPalette.soft }}>
            {days}
          </span>
        </div>

        {/* 四週天數格：連續的天數依序填滿 */}
        <div aria-hidden className="mt-8 grid grid-cols-7 gap-1.5">
          {Array.from({ length: GRID_DAYS }, (_, i) => (
            <div key={i} className="aspect-square rounded-[3px]" style={{ background: i < streak ? accent : recapPalette.line }} />
          ))}
        </div>
      </div>
    </RecapFrame>
  );
}
