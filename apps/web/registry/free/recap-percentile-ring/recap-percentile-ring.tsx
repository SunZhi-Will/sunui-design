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

// 根據排名百分比獲取等級和顏色
export function getRankLevel(rank: number | null): { level: RecapRankLevel; color: string; glow: string } {
  if (rank === null || rank === undefined) {
    return { level: "unknown", color: "from-gray-500 via-slate-500 to-zinc-500", glow: "rgba(107, 114, 128, 0.6)" };
  }
  if (rank <= 0.1) return { level: "top01", color: "from-purple-500 via-pink-500 to-red-500", glow: "rgba(168, 85, 247, 0.6)" };
  if (rank <= 1) return { level: "top1", color: "from-blue-500 via-cyan-500 to-teal-500", glow: "rgba(59, 130, 246, 0.6)" };
  if (rank <= 5) return { level: "top5", color: "from-green-500 via-emerald-500 to-teal-500", glow: "rgba(34, 197, 94, 0.6)" };
  if (rank <= 10) return { level: "top10", color: "from-yellow-500 via-amber-500 to-orange-500", glow: "rgba(234, 179, 8, 0.6)" };
  if (rank <= 25) return { level: "top25", color: "from-orange-500 via-red-500 to-pink-500", glow: "rgba(249, 115, 22, 0.6)" };
  return { level: "top50", color: "from-gray-500 via-slate-500 to-zinc-500", glow: "rgba(107, 114, 128, 0.6)" };
}

export function RecapPercentileRing({ percentileRank, locale = "en", labels, className }: RecapPercentileRingProps) {
  const reduce = useReducedMotion() ?? false;
  const tr = (t: Transition): Transition => (reduce ? { duration: 0 } : t);
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, levels: { ...base.levels, ...labels?.levels } };

  const rank = percentileRank ?? null;
  const displayValue = formatPercentile(rank);
  const rankLevel = getRankLevel(rank);

  // 生成圓形進度條的點（排名百分比越低越好，所以用 100 - rank）
  const progressDots = useMemo(() => {
    const totalDots = 100;
    const activeDots = rank !== null ? Math.round(100 - rank) : 0;
    return Array.from({ length: totalDots }, (_, i) => ({
      id: i,
      angle: (i / totalDots) * 360,
      isActive: i < activeDots,
    }));
  }, [rank]);

  // 生成光點效果
  const lightParticles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (i / 20) * 360,
        radius: 35 + Math.random() * 5,
        delay: Math.random() * 2,
      })),
    [],
  );

  return (
    <div
      className={cn(
        "@container relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950/50 via-purple-950/40 to-pink-950/50 p-6",
        className,
      )}
      // 卡片原本的深色底，漸層疊在上面
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* 背景圓形進度條 */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <svg className="h-full w-full" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
          {progressDots.map((dot) => {
            const radian = (dot.angle * Math.PI) / 180;
            const x = 100 + Math.cos(radian) * 80;
            const y = 100 + Math.sin(radian) * 80;
            return (
              <motion.circle
                key={dot.id}
                cx={x}
                cy={y}
                r={dot.isActive ? 2 : 1}
                fill={dot.isActive ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: dot.isActive ? [0, 1.2, 1] : [0, 0.8, 0.5],
                  opacity: dot.isActive ? [0, 1, 0.8] : [0, 0.3, 0.2],
                }}
                transition={tr({ duration: 0.5, delay: dot.id * 0.01 })}
              />
            );
          })}
        </svg>
      </div>

      {/* 光點粒子效果 */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        {!reduce &&
          lightParticles.map((p) => {
            const radian = (p.angle * Math.PI) / 180;
            return (
              <motion.div
                key={p.id}
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{ left: `${50 + Math.cos(radian) * p.radius}%`, top: `${50 + Math.sin(radian) * p.radius}%` }}
                animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            );
          })}
      </div>

      {/* 中心發光效果 */}
      <motion.div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={tr({ duration: 1 })}
      >
        <motion.div
          className={cn("h-64 w-64 rounded-full bg-gradient-to-r blur-3xl", rankLevel.color)}
          animate={reduce ? { scale: 1, opacity: 0.3 } : { scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={tr({ duration: 3, repeat: Infinity, ease: "easeInOut" })}
        />
      </motion.div>

      <div className="relative z-10 w-full max-w-md text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tr({ duration: 0.6 })}
          className="mb-8 text-2xl font-bold text-white @md:text-3xl"
        >
          {l.title}
        </motion.h1>

        {/* 排名百分比顯示 */}
        <motion.div
          initial={{ opacity: 0, scale: 0, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={tr({ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 })}
          className="relative mb-8"
          style={{ perspective: "1000px" }}
        >
          <div className="relative">
            {/* 發光效果 */}
            <motion.div
              aria-hidden
              className={cn("absolute inset-0 rounded-full bg-gradient-to-r blur-3xl", rankLevel.color)}
              style={{ opacity: 0.4 }}
              animate={reduce ? { scale: 1, opacity: 0.4 } : { scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={tr({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
            />
            <motion.div
              className={cn(
                "relative z-10 mb-4 bg-gradient-to-r bg-clip-text text-8xl font-bold text-transparent @md:text-9xl",
                rankLevel.color,
              )}
              style={{ textShadow: `0 0 40px ${rankLevel.glow}`, WebkitTextStroke: "2px rgba(255, 255, 255, 0.1)" }}
              animate={reduce ? { scale: 1 } : { scale: [1, 1.05, 1] }}
              transition={tr({ duration: 3, repeat: Infinity, ease: "easeInOut" })}
            >
              {rank !== null ? `${displayValue}%` : l.notAvailable}
            </motion.div>
          </div>

          {rank !== null && (
            <motion.div
              className="text-2xl text-white/90 @md:text-3xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={tr({ delay: 0.6, duration: 0.5 })}
            >
              {l.subtitle}
            </motion.div>
          )}
        </motion.div>

        {/* 等級標籤或說明訊息 */}
        {rank !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tr({ delay: 0.8, duration: 0.6 })}
            className={cn(
              "inline-block rounded-2xl border border-white/20 bg-gradient-to-r bg-opacity-20 p-4 backdrop-blur-md",
              rankLevel.color,
            )}
          >
            <p className="text-lg font-semibold text-white @md:text-xl">{l.levels[rankLevel.level]}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tr({ delay: 0.8, duration: 0.6 })}
            className="inline-block max-w-md rounded-2xl border border-white/20 bg-gray-500/20 p-4 backdrop-blur-md"
          >
            <p className="text-center text-base font-semibold text-white/80 @md:text-lg">{l.noData}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
