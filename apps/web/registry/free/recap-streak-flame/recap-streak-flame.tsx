"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useMemo } from "react";

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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapStreakLabels, "comments">> & { comments?: Partial<RecapStreakLabels["comments"]> };
  className?: string;
}

// 根據連續天數選擇背景色系
function getBackground(streak: number) {
  if (streak < 3) return "from-slate-950/40 via-gray-950/30 to-zinc-950/40";
  if (streak < 7) return "from-blue-950/40 via-indigo-950/30 to-purple-950/40";
  if (streak < 14) return "from-purple-950/40 via-pink-950/30 to-rose-950/40";
  return "from-orange-950/40 via-red-950/30 to-pink-950/40";
}

export function RecapStreakFlame({ streak: streakProp, locale = "en", labels, className }: RecapStreakFlameProps) {
  const reduce = useReducedMotion() ?? false;
  const tr = (t: Transition): Transition => (reduce ? { duration: 0 } : t);
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, comments: { ...base.comments, ...labels?.comments } };
  const streak = streakProp ?? 0;
  const days = typeof l.days === "function" ? l.days(streak) : l.days;

  // 根據連續天數產生評論
  const comment =
    streak < 3 ? l.comments.low : streak < 7 ? l.comments.medium : streak < 14 ? l.comments.high : l.comments.veryHigh;

  // 生成火焰粒子（隨機值固定下來，重新渲染時不會跳動）
  const flames = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        i,
        left: 50 + (Math.random() - 0.5) * 20,
        bottom: 20 + Math.random() * 30,
        x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
        duration: Math.random() * 2 + 2,
        delay: Math.random() * 2,
      })),
    [],
  );

  return (
    <div
      className={cn(
        "@container relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br p-6",
        getBackground(streak),
        className,
      )}
      // 卡片原本的深色底，漸層疊在上面
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* 火焰/能量動畫背景 */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-80 w-80 rounded-full border-4 border-white/20"
          animate={reduce ? undefined : { scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute h-64 w-64 rounded-full border-2 border-white/10"
          animate={reduce ? undefined : { scale: [1, 1.2, 1], rotate: [360, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 火焰粒子效果 */}
      <div aria-hidden className="absolute inset-0">
        {!reduce &&
          flames.map((f) => (
            <motion.div
              key={f.i}
              className="absolute h-3 w-3 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(255, ${100 + f.i * 10}, 0, 0.8), transparent)`,
                left: `${f.left}%`,
                bottom: `${f.bottom}%`,
              }}
              animate={{ y: [0, -100, -200], x: f.x, opacity: [0, 1, 0], scale: [0.5, 1.5, 0] }}
              transition={{ duration: f.duration, repeat: Infinity, delay: f.delay, ease: "easeOut" }}
            />
          ))}
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tr({ duration: 0.6 })}
          className="mb-6 text-2xl font-bold text-white @md:text-3xl"
        >
          {l.title}
        </motion.h1>

        {/* 連續天數顯示 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={tr({ delay: 0.3, duration: 0.8, type: "spring" })}
          className="relative mb-8 inline-block"
        >
          {/* 發光效果 */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/30 via-red-400/30 to-pink-400/30 blur-3xl"
            animate={reduce ? { scale: 1, opacity: 0.4 } : { scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={tr({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
          />

          {/* 數字 */}
          <motion.div
            key={streak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={tr({ duration: 0.5, type: "spring" })}
            className="relative text-8xl font-bold text-white @md:text-9xl"
            style={{ textShadow: "0 0 20px rgba(255, 100, 0, 0.8), 0 0 40px rgba(255, 50, 0, 0.6)" }}
          >
            {streak}
          </motion.div>
        </motion.div>

        {/* 天數標籤 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tr({ delay: 0.6 })}
          className="mb-6"
        >
          <div className="text-2xl font-semibold text-white/90 @md:text-3xl">{days}</div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={tr({ delay: 0.8 })}
          className="mb-4 text-xl text-white/90 @md:text-2xl"
        >
          {l.subtitle}
        </motion.p>

        {/* 評語卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={tr({ delay: 1 })}
          className="inline-block rounded-xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md"
        >
          <p className="text-lg font-medium text-white @md:text-xl">{comment}</p>
        </motion.div>
      </div>
    </div>
  );
}
