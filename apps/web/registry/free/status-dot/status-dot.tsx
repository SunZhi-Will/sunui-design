"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 狀態圓點：形狀說進度，時間說新鮮度。
 * - shape：dot（預設，6px 實心圓點，和舊版一樣）、ring 空環＝待處理、half 半圓＝處理中、
 *   full 實心＝完成、slashed 斜線環＝取消。也可直接給 progress（0 到 1）畫任意扇形
 * - live：只有進行中的狀態會動，一圈安靜的外擴環；reduced motion 下不動
 * - since：後面接淡色的相對時間「· 2 小時前」，用 Intl.RelativeTimeFormat，每 30 秒更新
 * 狀態改變時就地變形：扇形填到新的量、文字上下滾動換字、寬度跟著走，圓點是錨點不動。
 * 顏色只在圓點上（8px 以下），文字維持一般字色；黑白下只看形狀也讀得懂。
 */

// 中性色系 app（Schedary、usermeld、spliteat、ComfyUI）共用的狀態色，淺色與深色各一組
const STATUS_TOKENS =
  "[--db-success:#15803D] [--db-warning:#B45309] [--db-danger:#DC2626] [--db-info:#4F46E5] dark:[--db-success:#4ADE80] dark:[--db-warning:#FBBF24] dark:[--db-danger:#F87171] dark:[--db-info:#818CF8]";

export type StatusTone = "success" | "warning" | "destructive" | "muted" | "info";
export type StatusShape = "dot" | "ring" | "half" | "full" | "slashed";

const TONE: Record<StatusTone, string> = {
  success: "text-(--db-success)",
  warning: "text-(--db-warning)",
  destructive: "text-(--db-danger)",
  muted: "text-muted-foreground",
  info: "text-(--db-info)",
};

const FILL: Record<StatusShape, number> = { dot: 1, ring: 0, half: 0.5, full: 1, slashed: 0 };

const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };

// sunui-motion 的 roll：舊字往變動方向離開，新字從另一側進來
const roll: Variants = {
  enter: (d: number) => ({ y: d >= 0 ? "60%" : "-60%", opacity: 0 }),
  center: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 520, damping: 34 } },
  exit: (d: number) => ({ y: d >= 0 ? "-60%" : "60%", opacity: 0, transition: { duration: 0.12 } }),
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface StatusDotProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
  /** 形狀，預設 dot（和舊版相同的 6px 實心點） */
  shape?: StatusShape;
  /** 0 到 1 的進度，畫成扇形；優先於 shape 的填滿量（slashed 仍保留斜線） */
  progress?: number;
  /** 進行中：圓點外一圈安靜的外擴環。只給還在跑的狀態（處理中、建置中） */
  live?: boolean;
  /** 狀態發生的時間，顯示成「· 2 小時前」 */
  since?: Date | number | string;
  /** 相對時間的語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relative(ms: number, locale: SunLocale) {
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const sec = Math.round((ms - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(sec) >= size) return fmt.format(Math.round(sec / size), unit);
  }
  return fmt.format(0, "second");
}

/** 每 30 秒重畫一次相對時間；沒有 since 就不開計時器 */
function useNow(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, [active]);
}

function Glyph({ shape, fill, live, reduce }: { shape: StatusShape; fill: number; live: boolean; reduce: boolean }) {
  const t = reduce ? instant : gentle;
  const isDot = shape === "dot";
  return (
    <span aria-hidden className={cn("relative inline-grid shrink-0 place-items-center", isDot ? "size-1.5" : "size-2")}>
      {live && !reduce && (
        <motion.span
          className="absolute inset-0 rounded-full border border-current"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1], repeat: Infinity, repeatDelay: 0.6 }}
        />
      )}
      <svg viewBox="0 0 10 10" className="size-full overflow-visible">
        {!isDot && <circle cx={5} cy={5} r={4.25} fill="none" stroke="currentColor" strokeWidth={1.5} />}
        {/* 扇形：r=2.5、線寬 5 的圓，pathLength 就是填滿量；從 12 點鐘方向順時針 */}
        <motion.circle
          cx={5}
          cy={5}
          r={2.5}
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          transform="rotate(-90 5 5)"
          initial={false}
          animate={{ pathLength: fill, opacity: fill > 0 ? 1 : 0 }}
          transition={t}
        />
        <motion.line
          x1={2}
          y1={8}
          x2={8}
          y2={2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: shape === "slashed" ? 1 : 0, opacity: shape === "slashed" ? 1 : 0 }}
          transition={t}
        />
      </svg>
    </span>
  );
}

/**
 * 全站統一的狀態標示：小圓點加文字。
 * 顏色只放在圓點上，文字維持一般字色，一整排狀態不會變成彩虹。
 */
export function StatusDot({ tone, children, className, shape, progress, live = false, since, locale = "en" }: StatusDotProps) {
  const reduce = !!useReducedMotion();
  const s: StatusShape = shape ?? (progress != null ? "half" : "dot");
  const fill = s === "dot" ? 1 : Math.min(Math.max(progress ?? FILL[s], 0), 1);
  const key =
    typeof children === "string" || typeof children === "number" ? `l:${children}` : `s:${tone}:${s}:${fill}`;

  // 滾動方向跟著進度走：前進往上、倒退往下
  const [track, setTrack] = useState({ key, fill, dir: 1 });
  const dir = track.key === key ? track.dir : fill >= track.fill ? 1 : -1;
  if (track.key !== key) setTrack({ key, fill, dir });

  // 寬度：量隱形的副本，外框用 gentle 彈簧跟上
  const measure = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | "auto">("auto");
  useIsoLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const read = () => setWidth(el.offsetWidth);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [key]);

  const at = since == null ? null : new Date(since);
  const valid = at != null && !Number.isNaN(at.getTime());
  useNow(valid);
  const loc = resolveLocale(locale);

  return (
    <span className={cn(STATUS_TOKENS, "inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span className={cn("inline-grid", TONE[tone])}>
        <Glyph shape={s} fill={fill} live={live} reduce={reduce} />
      </span>
      <motion.span
        className="relative inline-flex overflow-hidden"
        initial={false}
        animate={{ width }}
        transition={reduce ? instant : gentle}
      >
        <span ref={measure} aria-hidden className="invisible absolute top-0 left-0 whitespace-nowrap">
          {children}
        </span>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.span
            key={key}
            custom={dir}
            variants={reduce ? undefined : roll}
            initial={reduce ? false : "enter"}
            animate="center"
            exit={reduce ? undefined : "exit"}
            className="inline-block whitespace-nowrap"
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      {at && valid && (
        <time dateTime={at.toISOString()} suppressHydrationWarning className="text-muted-foreground tabular-nums">
          <span aria-hidden>· </span>
          {relative(at.getTime(), loc)}
        </time>
      )}
    </span>
  );
}
