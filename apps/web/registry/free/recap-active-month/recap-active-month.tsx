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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Omit<RecapMonthLabels, "comments">> & { comments?: Partial<RecapMonthLabels["comments"]> };
  className?: string;
}

// 根據月份選擇背景色系
const backgrounds = [
  "from-blue-950/40 via-cyan-950/30 to-teal-950/40", // 一月
  "from-pink-950/40 via-rose-950/30 to-red-950/40", // 二月
  "from-green-950/40 via-emerald-950/30 to-teal-950/40", // 三月
  "from-yellow-950/40 via-amber-950/30 to-orange-950/40", // 四月
  "from-purple-950/40 via-violet-950/30 to-indigo-950/40", // 五月
  "from-cyan-950/40 via-blue-950/30 to-indigo-950/40", // 六月
  "from-orange-950/40 via-red-950/30 to-pink-950/40", // 七月
  "from-amber-950/40 via-yellow-950/30 to-lime-950/40", // 八月
  "from-emerald-950/40 via-green-950/30 to-teal-950/40", // 九月
  "from-orange-950/40 via-amber-950/30 to-yellow-950/40", // 十月
  "from-red-950/40 via-orange-950/30 to-amber-950/40", // 十一月
  "from-indigo-950/40 via-purple-950/30 to-pink-950/40", // 十二月
];

const allMonths = Array.from({ length: 12 }, (_, i) => i);

export function RecapActiveMonth({ data, monthNames: monthNamesProp, locale = "en", labels, className }: RecapActiveMonthProps) {
  const reduce = useReducedMotion() ?? false;
  const tr = (t: Transition): Transition => (reduce ? { duration: 0 } : t);
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, comments: { ...base.comments, ...labels?.comments } };
  const monthNames = monthNamesProp ?? base.months;

  const monthData = data ?? { month: "", monthIndex: 0, count: 0 };
  const monthName = monthNames[monthData.monthIndex] || monthData.month || monthNames[0] || base.months[0];
  const isActiveMonth = (index: number) => index === monthData.monthIndex;

  // 根據發佈數量產生評論
  const comment = monthData.count < 5 ? l.comments.low : monthData.count < 15 ? l.comments.medium : l.comments.high;

  return (
    <div
      className={cn(
        "@container relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br p-6",
        backgrounds[monthData.monthIndex] || backgrounds[0],
        className,
      )}
      // 卡片原本的深色底，漸層疊在上面
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* 背景裝飾：月份圓環 */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative h-96 w-96"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {allMonths.map((monthIndex) => (
            <motion.div
              key={monthIndex}
              className="absolute"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                left: "50%",
                top: "0",
                transformOrigin: "0 192px",
                transform: `rotate(${monthIndex * 30}deg) translateY(-192px)`,
              }}
              animate={{
                scale: isActiveMonth(monthIndex) && !reduce ? [1, 1.5, 1] : 1,
                opacity: isActiveMonth(monthIndex) ? (reduce ? 1 : [0.8, 1, 0.8]) : 0.3,
              }}
              transition={tr({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
            >
              <div className={cn("h-full w-full rounded-full", isActiveMonth(monthIndex) ? "bg-white" : "bg-white/30")} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tr({ duration: 0.6 })}
          className="mb-8 text-2xl font-bold text-white @md:text-3xl"
        >
          {l.title}
        </motion.h1>

        {/* 月份卡片：3D 翻轉效果 */}
        <motion.div
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={tr({ delay: 0.3, duration: 0.8, type: "spring" })}
          className="mb-8"
        >
          <div className="relative inline-block">
            {/* 發光效果 */}
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-3xl bg-white/30 blur-3xl"
              animate={reduce ? { scale: 1, opacity: 0.4 } : { scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={tr({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
            />

            {/* 月份卡片 */}
            <div className="relative max-w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 px-8 py-8 shadow-2xl backdrop-blur-xl @md:px-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={tr({ delay: 0.5, duration: 0.5 })}
                className="mb-4 text-5xl font-bold break-words text-white @md:text-6xl @lg:text-7xl"
              >
                {monthName}
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={tr({ delay: 0.7, duration: 0.5 })}
                className="flex items-baseline justify-center gap-3"
              >
                <span className="text-5xl font-bold text-white @md:text-6xl">{monthData.count}</span>
                <span className="text-xl text-white/80 @md:text-2xl">{l.posts}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 評語 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tr({ delay: 0.9 })}
          className="inline-block rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md"
        >
          <p className="text-lg text-white/90 @md:text-xl">{comment}</p>
        </motion.div>
      </div>
    </div>
  );
}
