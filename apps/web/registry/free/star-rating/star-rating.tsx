"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export type StarRatingSize = "sm" | "md" | "lg";

export interface StarRatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** 星星數量 */
  max?: number;
  /** 0.5 支援半星 */
  precision?: 0.5 | 1;
  /** 唯讀顯示模式，支援任意小數（例如 4.3） */
  readOnly?: boolean;
  disabled?: boolean;
  size?: StarRatingSize;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串；傳陣列時視為每個整數分數的文字（長度等於 max） */
  labels?: string[] | Partial<StarRatingLabels>;
  /** 是否在右側顯示文字標籤 */
  showLabel?: boolean;
  /** 再次點擊目前分數時清除為 0 */
  allowClear?: boolean;
  /** 搭配表單送出時的欄位名稱 */
  name?: string;
  /** 整組的無障礙名稱 */
  "aria-label"?: string;
  className?: string;
}

export interface StarRatingLabels {
  /** 每個整數分數對應的文字 */
  levels: string[];
  /** 整組預設的無障礙名稱 */
  group: string;
  rated: (value: number, max: number) => string;
  stars: (value: number) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, StarRatingLabels> = {
  en: {
    levels: ["Terrible", "Poor", "Okay", "Good", "Great"],
    group: "Rating",
    rated: (v, max) => `Rated ${v} out of ${max}`,
    stars: (v) => `${v} ${v === 1 ? "star" : "stars"}`,
  },
  "zh-TW": {
    levels: ["很差", "不太好", "普通", "不錯", "很棒"],
    group: "評分",
    rated: (v, max) => `評分 ${v} / ${max}`,
    stars: (v) => `${v} 顆星`,
  },
  "zh-CN": {
    levels: ["很差", "较差", "一般", "不错", "很棒"],
    group: "评分",
    rated: (v, max) => `评分 ${v} / ${max}`,
    stars: (v) => `${v} 颗星`,
  },
  ja: {
    levels: ["最悪", "いまいち", "ふつう", "良い", "最高"],
    group: "評価",
    rated: (v, max) => `${max} 点中 ${v} 点`,
    stars: (v) => `星 ${v}`,
  },
};

// 設計語言（DESIGN.md）：墨線星星，不用金色
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const stampSpring = { type: "spring", stiffness: 620, damping: 20, mass: 0.8 } as const;

const starSize: Record<StarRatingSize, string> = { sm: "size-4", md: "size-6", lg: "size-8" };
const labelSize: Record<StarRatingSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };

const STAR = "M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z";

/** 一顆星：底層墨線外框，上層依 fill 比例裁出實心 */
function Star({ fill, className }: { fill: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block", className)}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d={STAR} className="opacity-45" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" className={cn("block", className)} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d={STAR} />
        </svg>
      </span>
    </span>
  );
}

const round = (n: number, precision: number) => Math.round(n / precision) * precision;

export function StarRating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  precision = 1,
  readOnly = false,
  disabled = false,
  size = "md",
  locale = "en",
  labels: labelsProp,
  showLabel = true,
  allowClear = true,
  name,
  "aria-label": ariaLabelProp,
  className,
}: StarRatingProps) {
  const t = {
    ...MESSAGES[resolveLocale(locale)],
    ...(Array.isArray(labelsProp) ? { levels: labelsProp } : labelsProp),
  };
  const labels = t.levels;
  const ariaLabel = ariaLabelProp ?? t.group;
  const reduce = useReducedMotion() ?? false;
  const labelId = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const [pressedKey, setPressedKey] = useState(0);
  const refs = useRef(new Map<number, HTMLElement>());
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;
  const fillOf = (i: number) => Math.min(1, Math.max(0, shown - i));
  const labelFor = (v: number) => (v > 0 ? (labels[Math.min(Math.ceil(v), labels.length) - 1] ?? "") : "");

  if (readOnly) {
    const fixed = Math.round(value * 10) / 10;
    return (
      <div role="img" aria-label={t.rated(fixed, max)} className={cn("inline-flex items-center gap-0.5", ink, className)}>
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} fill={fillOf(i)} className={starSize[size]} />
        ))}
      </div>
    );
  }

  const commit = (next: number) => {
    if (!interactive) return;
    const v = Math.min(max, Math.max(0, round(next, precision)));
    if (valueProp === undefined) setInner(v);
    if (v > 0) setPressedKey((k) => k + 1);
    onValueChange?.(v);
  };

  // 所有可選分數，例如 0.5、1、1.5 …；roving tabindex 停在目前分數
  const steps = Array.from({ length: Math.round(max / precision) }, (_, i) => round((i + 1) * precision, precision));
  const tabStop = steps.includes(value) ? value : steps[0];

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, v: number) => {
    if (e.key === " " || e.key === "Enter") return (e.preventDefault(), commit(v));
    if ((e.key === "Backspace" || e.key === "Delete") && allowClear) return (e.preventDefault(), commit(0));
    const current = value || 0;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? Math.min(max, current + precision)
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? Math.max(precision, current - precision)
          : e.key === "Home"
            ? precision
            : e.key === "End"
              ? max
              : null;
    if (next === null) return;
    e.preventDefault();
    const r = round(next, precision);
    commit(r);
    refs.current.get(r)?.focus();
  };

  const radioLabel = (v: number) => `${t.stars(v)}${labelFor(v) ? `, ${labelFor(v)}` : ""}`;

  return (
    <div className={cn("inline-flex items-center gap-3", ink, className)}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-describedby={showLabel ? labelId : undefined}
        aria-disabled={disabled || undefined}
        onPointerLeave={() => setHover(null)}
        className={cn("flex items-center gap-0.5", disabled && "cursor-not-allowed opacity-50")}
      >
        {Array.from({ length: max }, (_, i) => {
          const whole = i + 1;
          const hits = precision === 0.5 ? [whole - 0.5, whole] : [whole];
          // 剛選定的那顆星像蓋章一樣先壓下再彈回
          const isLast = value > i && value <= whole;
          return (
            <span key={i} className={cn("relative block", starSize[size])}>
              <motion.span
                key={isLast ? `on-${pressedKey}` : "rest"}
                className="absolute inset-0 block"
                initial={isLast && pressedKey > 0 && !reduce ? { scale: 0.78 } : false}
                animate={{ scale: 1 }}
                transition={stampSpring}
              >
                <Star fill={fillOf(i)} className={starSize[size]} />
              </motion.span>
              {hits.map((v, k) => (
                <span
                  key={v}
                  role="radio"
                  aria-checked={value === v}
                  aria-label={radioLabel(v)}
                  aria-disabled={disabled || undefined}
                  tabIndex={disabled ? -1 : tabStop === v ? 0 : -1}
                  ref={(el) => {
                    if (el) refs.current.set(v, el);
                    else refs.current.delete(v);
                  }}
                  onPointerEnter={() => interactive && setHover(v)}
                  onClick={() => commit(allowClear && value === v ? 0 : v)}
                  onKeyDown={(e) => onKeyDown(e, v)}
                  className={cn(
                    "absolute inset-y-0 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    hits.length === 2 ? (k === 0 ? "left-0 w-1/2" : "right-0 w-1/2") : "inset-x-0",
                    disabled && "cursor-not-allowed",
                  )}
                />
              ))}
            </span>
          );
        })}
      </div>
      {showLabel && (
        <span id={labelId} className={cn("min-w-[6.5em] leading-none whitespace-nowrap", labelSize[size])}>
          {shown > 0 && <span className="font-mono tabular-nums">{shown.toFixed(precision === 0.5 ? 1 : 0)}</span>}
          <span className="ml-1.5 text-current/60">{labelFor(shown)}</span>
        </span>
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
