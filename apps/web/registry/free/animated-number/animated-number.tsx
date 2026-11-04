"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  value: number;
  locale?: string;
  /** 有給就以貨幣格式顯示，例如 "USD"、"TWD" */
  currency?: string;
  /** 額外的 Intl.NumberFormat 選項，會覆蓋預設 */
  formatOptions?: Intl.NumberFormatOptions;
  /** 數值變動後在右側短暫顯示一個墨色小箭頭 */
  trendArrow?: boolean;
  /** 箭頭維持多久（ms） */
  trendHold?: number;
  /** 由右而左每一位數的延遲（秒），像機械計數器逐輪帶動 */
  stagger?: number;
  /** 數值變動時是否透過 aria-live 朗讀 */
  announce?: boolean;
  className?: string;
}

// 狀態切換用 gentle 彈簧（DESIGN.md）
const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function AnimatedNumber({
  value,
  locale = "en-US",
  currency,
  formatOptions,
  trendArrow = false,
  trendHold = 1400,
  stagger = 0.03,
  announce = false,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion() ?? false;

  const format = useMemo(
    () => new Intl.NumberFormat(locale, { ...(currency ? { style: "currency", currency } : {}), ...formatOptions }),
    [locale, currency, formatOptions],
  );
  const text = format.format(value);
  const chars = Array.from(text);

  // 由前後值推導滾動方向（render 期間的衍生狀態，React 官方寫法）
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState<1 | -1>(1);
  const [trend, setTrend] = useState<{ dir: 1 | -1; key: number } | null>(null);
  if (value !== prev) {
    const next = value > prev ? 1 : -1;
    setPrev(value);
    setDir(next);
    if (trendArrow) setTrend({ dir: next, key: (trend?.key ?? 0) + 1 });
  }

  useEffect(() => {
    if (!trend) return;
    const t = setTimeout(() => setTrend(null), trendHold);
    return () => clearTimeout(t);
  }, [trend, trendHold]);

  return (
    <span className={cn("relative inline-flex items-baseline tabular-nums", className)}>
      <span className="sr-only" aria-live={announce ? "polite" : undefined}>
        {text}
      </span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((ch, i) => {
          // 以「距離右邊的位置」當 key，位數增減時個位數與小數點保持穩定
          const fromRight = chars.length - 1 - i;
          if (ch < "0" || ch > "9") {
            return (
              <span key={`s-${fromRight}`} className="inline-block whitespace-pre">
                {ch}
              </span>
            );
          }
          return (
            <DigitWheel key={`d-${fromRight}`} digit={Number(ch)} dir={dir} reduce={reduceMotion} delay={fromRight * stagger} />
          );
        })}
      </span>
      {trend && (
        <svg
          key={trend.key}
          viewBox="0 0 12 12"
          className="ml-1 size-[0.5em] min-h-2 min-w-2 self-center opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={trend.dir === 1 ? "M6 10V2M2.5 5.5 6 2l3.5 3.5" : "M6 2v8M2.5 6.5 6 10l3.5-3.5"} />
        </svg>
      )}
    </span>
  );
}

/** 一個數字輪：十個數字排成一圈，只往數值變動的方向轉，9 到 0 會繼續往前捲 */
function DigitWheel({ digit, dir, reduce, delay }: { digit: number; dir: 1 | -1; reduce: boolean; delay: number }) {
  const pos = useMotionValue(digit);
  const target = useRef(digit);

  useEffect(() => {
    const current = ((target.current % 10) + 10) % 10;
    if (current === digit) return;
    target.current += dir === 1 ? (digit - current + 10) % 10 : -((current - digit + 10) % 10);
    if (reduce) {
      pos.set(target.current);
      return;
    }
    const controls = animate(pos, target.current, { ...gentle, delay });
    return () => controls.stop();
  }, [digit, dir, reduce, delay, pos]);

  return (
    <span className="relative inline-block overflow-hidden">
      {/* 佔位字元決定欄寬與行高 */}
      <span className="invisible">0</span>
      {DIGITS.map((d) => (
        <WheelDigit key={d} digit={d} pos={pos} />
      ))}
    </span>
  );
}

function WheelDigit({ digit, pos }: { digit: number; pos: MotionValue<number> }) {
  // 把與目前位置的距離收斂到 [-5, 5)，讓數字繞成一圈
  const y = useTransform(pos, (p) => `${((((digit - p) % 10) + 15) % 10) * 100 - 500}%`);
  return (
    <motion.span className="absolute inset-x-0 top-0 text-center" style={{ y }}>
      {digit}
    </motion.span>
  );
}
