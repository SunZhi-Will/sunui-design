"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StarRatingSize = "sm" | "md" | "lg";

export interface StarRatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** 星星數量；emoji 變體固定為 5 */
  max?: number;
  /** 0.5 支援半星；emoji 變體固定為 1 */
  precision?: 0.5 | 1;
  /** 唯讀顯示模式，支援任意小數（例如 4.3） */
  readOnly?: boolean;
  disabled?: boolean;
  size?: StarRatingSize;
  /** star：星星；emoji：五個由皺眉到微笑的表情 */
  variant?: "star" | "emoji";
  /** 自訂圖示，請使用 fill="currentColor" 的 SVG */
  icon?: ReactNode;
  /** 已填色部分的 className，預設琥珀色 */
  activeClassName?: string;
  /** 每個整數分數對應的文字，長度等於 max */
  labels?: string[];
  /** 是否在下方顯示文字標籤 */
  showLabel?: boolean;
  /** 再次點擊目前分數時清除為 0 */
  allowClear?: boolean;
  /** 搭配表單送出時的欄位名稱 */
  name?: string;
  /** 整組的無障礙名稱 */
  "aria-label"?: string;
  className?: string;
}

const starLabels = ["Terrible", "Poor", "Okay", "Good", "Great"];
const emojiLabels = ["Awful", "Bad", "Okay", "Good", "Amazing"];

const starSize: Record<StarRatingSize, string> = { sm: "size-4", md: "size-6", lg: "size-8" };
const emojiSize: Record<StarRatingSize, string> = { sm: "size-7", md: "size-9", lg: "size-11" };
const labelSize: Record<StarRatingSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };

// 表情顏色由紅到綠
const faceColors = ["text-rose-500", "text-orange-500", "text-amber-500", "text-lime-500", "text-emerald-500"];

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full">
      <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
    </svg>
  );
}

/** 第 index 個表情（0 皺眉到 4 微笑） */
function Face({ index }: { index: number }) {
  // 嘴角彎曲程度：負值向下（皺眉），正值向上（微笑）
  const curve = [-4, -2, 0, 2.5, 4.5][index];
  const mouth = index === 2 ? "M8.5 15.5h7" : `M8 15.5 Q12 ${15.5 + curve} 16 15.5`;
  return (
    <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.14" />
      {index === 0 ? (
        <path d="M7.5 9.5l2 .8M16.5 9.5l-2 .8" />
      ) : (
        <>
          <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
        </>
      )}
      <path d={mouth} />
    </svg>
  );
}

function round(n: number, precision: number) {
  return Math.round(n / precision) * precision;
}

export function StarRating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max: maxProp = 5,
  precision: precisionProp = 1,
  readOnly = false,
  disabled = false,
  size = "md",
  variant = "star",
  icon,
  activeClassName = "text-amber-400",
  labels,
  showLabel = true,
  allowClear = true,
  name,
  "aria-label": ariaLabel = "Rating",
  className,
}: StarRatingProps) {
  const reduce = useReducedMotion() ?? false;
  const labelId = useId();
  const isEmoji = variant === "emoji";
  const max = isEmoji ? 5 : maxProp;
  const precision = isEmoji ? 1 : precisionProp;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const refs = useRef(new Map<number, HTMLElement>());
  const text = labels ?? (isEmoji ? emojiLabels : starLabels);
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;
  const labelFor = (v: number) => (v > 0 ? text[Math.min(Math.ceil(v), text.length) - 1] ?? "" : "");

  const commit = (next: number) => {
    if (!interactive) return;
    const v = Math.min(max, Math.max(0, round(next, precision)));
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
  };

  // 所有可選分數，例如 0.5、1、1.5 …
  const steps = Array.from({ length: Math.round(max / precision) }, (_, i) => round((i + 1) * precision, precision));
  // roving tabindex：目前分數可 Tab 進入，沒有分數時是第一個
  const tabStop = steps.includes(value) ? value : steps[0];

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    let next: number | null = null;
    const current = value || 0;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(max, current + precision);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(precision, current - precision);
        break;
      case "Home":
        next = precision;
        break;
      case "End":
        next = max;
        break;
      case "Backspace":
      case "Delete":
        if (allowClear) {
          e.preventDefault();
          commit(0);
        }
        return;
    }
    if (next === null) return;
    e.preventDefault();
    const v = round(next, precision);
    commit(v);
    refs.current.get(v)?.focus();
  };

  const radioLabel = (v: number) => {
    const word = labelFor(v);
    if (isEmoji) return word;
    return `${v} ${v === 1 ? "star" : "stars"}${word ? `, ${word}` : ""}`;
  };

  // 唯讀：整組以圖片呈現
  if (readOnly) {
    const fixed = Math.round(value * 10) / 10;
    return (
      <div className={cn("inline-flex flex-col items-start gap-1", className)}>
        <div role="img" aria-label={`Rated ${fixed} out of ${max}`} className="flex items-center gap-0.5">
          {Array.from({ length: max }, (_, i) => {
            if (isEmoji) {
              const chosen = Math.round(value) === i + 1;
              return (
                <span
                  key={i}
                  className={cn(emojiSize[size], chosen ? faceColors[i] : "text-muted-foreground/40")}
                  style={chosen ? { transform: "scale(1.2)" } : undefined}
                >
                  <Face index={i} />
                </span>
              );
            }
            const fill = Math.min(1, Math.max(0, value - i)) * 100;
            return (
              <span key={i} className={cn("relative block", starSize[size])}>
                <span className="absolute inset-0 text-muted-foreground/25">{icon ?? <StarIcon />}</span>
                <span className={cn("absolute inset-0 overflow-hidden", activeClassName)} style={{ width: `${fill}%` }}>
                  <span className={cn("block", starSize[size])}>{icon ?? <StarIcon />}</span>
                </span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1.5", className)}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-describedby={showLabel ? labelId : undefined}
        aria-disabled={disabled || undefined}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
        }}
        className={cn("flex items-center", isEmoji ? "gap-2" : "gap-0.5", disabled && "cursor-not-allowed opacity-50")}
      >
        {Array.from({ length: max }, (_, i) => {
          const whole = i + 1;
          const half = whole - 0.5;
          const hitValues = precision === 0.5 ? [half, whole] : [whole];

          if (isEmoji) {
            const chosen = Math.round(shown) === whole;
            const selected = value === whole;
            return (
              <motion.button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={radioLabel(whole)}
                tabIndex={tabStop === whole ? 0 : -1}
                disabled={disabled}
                ref={(el: HTMLButtonElement | null) => {
                  if (el) refs.current.set(whole, el);
                  else refs.current.delete(whole);
                }}
                onPointerEnter={() => interactive && setHover(whole)}
                onClick={() => commit(allowClear && selected ? 0 : whole)}
                onKeyDown={onKeyDown}
                animate={{ scale: chosen ? 1.25 : 1 }}
                whileTap={reduce ? undefined : { scale: 1.1 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 18 }}
                className={cn(
                  "rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  emojiSize[size],
                  chosen ? faceColors[i] : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                <Face index={i} />
              </motion.button>
            );
          }

          const fill = Math.min(1, Math.max(0, shown - i)) * 100;
          const popped = !reduce && value >= whole - 0.5 && value <= whole && value > 0;
          return (
            <span key={i} className={cn("relative block", starSize[size])}>
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 block"
                key={popped ? `pop-${value}` : "still"}
                initial={popped ? { scale: 0.6 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 600, damping: 14 }}
              >
                <span className="absolute inset-0 text-muted-foreground/25">{icon ?? <StarIcon />}</span>
                <span
                  className={cn("absolute inset-0 overflow-hidden", activeClassName, !reduce && "transition-[width] duration-100")}
                  style={{ width: `${fill}%` }}
                >
                  <span className={cn("block", starSize[size])}>{icon ?? <StarIcon />}</span>
                </span>
              </motion.span>
              {hitValues.map((v, k) => (
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
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      commit(v);
                      return;
                    }
                    onKeyDown(e);
                  }}
                  className={cn(
                    "absolute inset-y-0 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    hitValues.length === 2 ? (k === 0 ? "left-0 w-1/2" : "right-0 w-1/2") : "inset-x-0",
                    disabled && "cursor-not-allowed",
                  )}
                />
              ))}
            </span>
          );
        })}
      </div>
      {showLabel && (
        <span
          id={labelId}
          className={cn(
            "min-h-[1.25em] leading-tight text-muted-foreground",
            labelSize[size],
            isEmoji && "self-stretch text-center",
            focused && "text-foreground",
          )}
        >
          {labelFor(shown)}
          {!isEmoji && shown > 0 && <span className="ml-1.5 tabular-nums opacity-70">{shown.toFixed(precision === 0.5 ? 1 : 0)}</span>}
        </span>
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
