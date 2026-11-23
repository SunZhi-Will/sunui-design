"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  value: number;
  locale?: string;
  /** Shown in currency format when given, e.g. "USD", "TWD" */
  currency?: string;
  /** Extra Intl.NumberFormat options, overriding the defaults */
  formatOptions?: Intl.NumberFormatOptions;
  /** After the value changes, briefly show a small text-coloured arrow on the right */
  trendArrow?: boolean;
  /** How long the arrow stays (ms) */
  trendHold?: number;
  /** Per-digit delay in seconds from right to left, so the wheels turn one after another like a mechanical counter */
  stagger?: number;
  /** Whether to announce value changes through aria-live */
  announce?: boolean;
  /**
   * plain (default): inline text that inherits the surrounding type, for use inside sentences and stats.
   * odometer: each digit sits on its own steel wheel inside a metal housing, for a total or counter that is the focus of a card
   */
  variant?: "plain" | "odometer";
  className?: string;
}

// gentle spring for state changes (DESIGN.md)
const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Material (DESIGN.md section 7, metal rim): the housing is foreground mixed into the surface, light from straight above,
// with a 1px white top line. Each wheel is a recessed steel drum, darker at the top and bottom where it curves away
const mix = (pct: number) => `color-mix(in oklch, var(--foreground) ${pct}%, var(--card))`;
const drum: CSSProperties = { backgroundImage: `linear-gradient(180deg, ${mix(22)}, var(--card) 32%, var(--card) 68%, ${mix(22)})` };
// In dark mode the foreground is light, so the mix runs the other way to keep the light coming from above
const housingClass =
  "bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_8%,var(--card)),color-mix(in_oklch,var(--foreground)_24%,var(--card))_50%,color-mix(in_oklch,var(--foreground)_42%,var(--card)))] dark:bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_30%,var(--card)),color-mix(in_oklch,var(--foreground)_18%,var(--card))_50%,color-mix(in_oklch,var(--foreground)_8%,var(--card)))] " +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_0_0_1px_rgb(0_0_0/0.08),0_1px_2px_rgb(0_0_0/0.12)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_0_0_1px_rgb(255_255_255/0.08)]";
const drumShadow = "shadow-[inset_0_1px_2px_rgb(0_0_0/0.28),inset_0_-1px_0_rgb(255_255_255/0.35),0_0_0_0.5px_rgb(0_0_0/0.18)] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),0_0_0_0.5px_rgb(0_0_0/0.5)]";

export function AnimatedNumber({
  value,
  locale = "en-US",
  currency,
  formatOptions,
  trendArrow = false,
  trendHold = 1400,
  stagger = 0.03,
  announce = false,
  variant = "plain",
  className,
}: AnimatedNumberProps) {
  const odometer = variant === "odometer";
  const reduceMotion = useReducedMotion() ?? false;

  const format = useMemo(
    () => new Intl.NumberFormat(locale, { ...(currency ? { style: "currency", currency } : {}), ...formatOptions }),
    [locale, currency, formatOptions],
  );
  const text = format.format(value);
  const chars = Array.from(text);

  // Derive the scroll direction from the previous and next values (derived state during render, the approach the React docs recommend)
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
      <span
        aria-hidden="true"
        className={cn("inline-flex", odometer && cn("items-center gap-[0.06em] rounded-[0.18em] px-[0.12em] py-[0.1em]", housingClass))}
      >
        {chars.map((ch, i) => {
          // Key by "position from the right", so the ones digit and decimal point stay stable when the digit count changes
          const fromRight = chars.length - 1 - i;
          if (ch < "0" || ch > "9") {
            return (
              <span key={`s-${fromRight}`} className={cn("inline-block whitespace-pre", odometer && "px-[0.02em]")}>
                {ch}
              </span>
            );
          }
          return (
            <DigitWheel key={`d-${fromRight}`} digit={Number(ch)} dir={dir} reduce={reduceMotion} delay={fromRight * stagger} odometer={odometer} />
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

/** One digit wheel: ten digits arranged in a ring, rotating only in the direction the value changes; 9 to 0 keeps rolling forward */
function DigitWheel({ digit, dir, reduce, delay, odometer }: { digit: number; dir: 1 | -1; reduce: boolean; delay: number; odometer: boolean }) {
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
    <span className={cn("relative inline-block overflow-hidden", odometer && cn("rounded-[0.1em] px-[0.08em]", drumShadow))} style={odometer ? drum : undefined}>
      {/* Placeholder character sets the column width and line height */}
      <span className="invisible">0</span>
      {DIGITS.map((d) => (
        <WheelDigit key={d} digit={d} pos={pos} />
      ))}
    </span>
  );
}

function WheelDigit({ digit, pos }: { digit: number; pos: MotionValue<number> }) {
  // Reduce the distance from the current position into [-5, 5), so the digits wrap into a ring
  const y = useTransform(pos, (p) => `${((((digit - p) % 10) + 15) % 10) * 100 - 500}%`);
  return (
    <motion.span className="absolute inset-x-0 top-0 text-center" style={{ y }}>
      {digit}
    </motion.span>
  );
}
