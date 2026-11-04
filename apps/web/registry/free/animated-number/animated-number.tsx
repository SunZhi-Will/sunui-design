"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type NumberTrend = "up" | "down" | null;

export interface AnimatedNumberProps {
  value: number;
  locale?: string;
  /** 有給就以貨幣格式顯示，例如 "USD"、"TWD" */
  currency?: string;
  /** 額外的 Intl.NumberFormat 選項，會覆蓋預設 */
  formatOptions?: Intl.NumberFormatOptions;
  /** 數值上升或下降時短暫上色 */
  trendColors?: boolean;
  /** 上升時視為好消息（預設）；價格類可設為 false，讓上漲顯示紅色 */
  upIsGood?: boolean;
  /** 每位數滾動秒數 */
  duration?: number;
  /** 由右而左每一位數的延遲（秒） */
  stagger?: number;
  /** 顏色提示維持多久（ms） */
  trendHold?: number;
  /** 數值變動時是否透過 aria-live 朗讀 */
  announce?: boolean;
  className?: string;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function AnimatedNumber({
  value,
  locale = "en-US",
  currency,
  formatOptions,
  trendColors = true,
  upIsGood = true,
  duration = 0.6,
  stagger = 0.04,
  trendHold = 1200,
  announce = false,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();

  const format = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        ...(currency ? { style: "currency", currency } : {}),
        ...formatOptions,
      }),
    [locale, currency, formatOptions],
  );
  const text = format.format(value);
  const chars = Array.from(text);

  // 只在 effect 中比較前後值，避免 render 期間的副作用
  const prev = useRef(value);
  const [trend, setTrend] = useState<NumberTrend>(null);
  useEffect(() => {
    if (value === prev.current) return;
    const next: NumberTrend = value > prev.current ? "up" : "down";
    prev.current = value;
    if (!trendColors) return;
    setTrend(next);
    const t = setTimeout(() => setTrend(null), trendHold);
    return () => clearTimeout(t);
  }, [value, trendColors, trendHold]);

  const good = trend === "up" ? upIsGood : trend === "down" ? !upIsGood : null;

  return (
    <span
      className={cn(
        "relative inline-flex items-baseline tabular-nums transition-colors duration-500",
        good === true && "text-emerald-600 dark:text-emerald-400",
        good === false && "text-rose-600 dark:text-rose-400",
        className,
      )}
    >
      <span className="sr-only" aria-live={announce ? "polite" : undefined}>
        {text}
      </span>
      <span aria-hidden="true" className="inline-flex items-start">
        {chars.map((ch, i) => {
          // 以「距離右邊的位置」當 key，小數點與個位數在增減位數時保持穩定
          const fromRight = chars.length - 1 - i;
          const isDigit = ch >= "0" && ch <= "9";
          if (!isDigit) {
            return (
              <span key={`s-${fromRight}`} className="inline-block h-[1lh] whitespace-pre">
                {ch}
              </span>
            );
          }
          return (
            <DigitColumn
              key={`d-${fromRight}`}
              digit={Number(ch)}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration, delay: fromRight * stagger, ease: [0.22, 1, 0.36, 1] }
              }
            />
          );
        })}
      </span>
      {trend && !reduceMotion && (
        <span className="pointer-events-none absolute top-1/2 left-full -translate-y-1/2 pl-1" aria-hidden="true">
          <TrendArrow key={`${trend}-${value}`} trend={trend} />
        </span>
      )}
    </span>
  );
}

function DigitColumn({ digit, transition }: { digit: number; transition: Transition }) {
  return (
    <span className="relative inline-block h-[1lh] overflow-hidden">
      {/* 佔位字元決定欄寬 */}
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={transition}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1lh] text-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function TrendArrow({ trend }: { trend: Exclude<NumberTrend, null> }) {
  return (
    <motion.svg
      viewBox="0 0 12 12"
      className="block size-[0.45em] min-h-2 min-w-2"
      fill="currentColor"
      initial={{ opacity: 0, y: trend === "up" ? 4 : -4 }}
      animate={{ opacity: [0, 1, 1, 0], y: 0 }}
      transition={{ duration: 1.2, times: [0, 0.15, 0.7, 1] }}
      aria-hidden="true"
    >
      <path d={trend === "up" ? "M6 2l4 6H2z" : "M6 10L2 4h8z"} />
    </motion.svg>
  );
}
