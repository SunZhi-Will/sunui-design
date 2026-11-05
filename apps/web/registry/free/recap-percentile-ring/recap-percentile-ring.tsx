"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

export type RecapRankLevel = "top01" | "top1" | "top5" | "top10" | "top25" | "top50" | "unknown";

export interface RecapPercentileLabels {
  title: string;
  subtitle: string;
  noData: string;
  /** 沒有排名資料時大字顯示的內容 */
  notAvailable: string;
  levels: Record<RecapRankLevel, string>;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, RecapPercentileLabels> = {
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
export const recapPercentileLabels = MESSAGES.en;

export interface RecapPercentileRingProps {
  /** 排名百分比（越小越好），null 代表沒有可比較的資料 */
  percentileRank: number | null;
  /** 唯一強調色（已填滿的刻度點與等級標籤的點），預設琥珀金 #d4a24c */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapPercentileLabels, "levels">> & { levels?: Partial<Record<RecapRankLevel, string>> };
  className?: string;
}

// 格式化排名百分比顯示
export function formatPercentile(rank: number | null): string {
  if (rank === null || rank === undefined) return "N/A";
  if (rank < 0.01) return "0.01"; // 最小顯示 0.01%
  if (rank < 1) return rank.toFixed(2); // 小於 1% 顯示兩位小數
  if (rank < 10) return rank.toFixed(1); // 1-10% 顯示一位小數
  return Math.round(rank).toString(); // 大於 10% 顯示整數
}

/**
 * 根據排名百分比取得等級。
 * color 與 glow 為舊版 API 保留的欄位，元件本身已不使用（不再依等級換彩色漸層），
 * 現在一律回傳中性值。
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

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * 年度回顧的「排名」：100 個刻度點排成一圈，填滿 100 減排名的數量；
 * 圈中央是大號襯線數字。只有一次整體淡入，沒有粒子、光暈或常駐動態。
 */
export function RecapPercentileRing({ percentileRank, accent = "#d4a24c", locale = "en", labels, className }: RecapPercentileRingProps) {
  const reduce = useReducedMotion() ?? false;
  const tr = (t: Transition): Transition => (reduce ? { duration: 0 } : t);
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, levels: { ...base.levels, ...labels?.levels } };

  const rank = percentileRank ?? null;
  const displayValue = formatPercentile(rank);
  const rankLevel = getRankLevel(rank);

  // 生成圓形刻度點（排名百分比越低越好，所以用 100 - rank）
  const progressDots = useMemo(() => {
    const totalDots = 100;
    const activeDots = rank !== null ? Math.round(100 - rank) : 0;
    return Array.from({ length: totalDots }, (_, i) => ({
      id: i,
      angle: (i / totalDots) * 360,
      isActive: i < activeDots,
    }));
  }, [rank]);

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
            {rank !== null && <div className="mb-1 text-sm font-medium uppercase tracking-[0.14em] text-[#a8a29e]">{l.subtitle}</div>}
            <div className="font-serif text-7xl leading-none tracking-[-0.03em] tabular-nums lining-nums @md:text-8xl">
              {rank !== null ? (
                <>
                  {displayValue}
                  <span className="ml-0.5 align-top text-[0.45em] text-[#a8a29e]">%</span>
                </>
              ) : (
                l.notAvailable
              )}
            </div>
          </div>
        </div>

        {/* 等級標籤或說明訊息 */}
        <div className="border-t pt-4" style={{ borderColor: "rgb(255 255 255 / 0.08)" }}>
          {rank !== null ? (
            <p className="flex items-center gap-2 text-[15px] font-medium text-[#f5f5f4] @md:text-base">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: accent }} />
              {l.levels[rankLevel.level]}
            </p>
          ) : (
            <p className="text-[15px] leading-relaxed text-[#a8a29e] @md:text-base">{l.noData}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
