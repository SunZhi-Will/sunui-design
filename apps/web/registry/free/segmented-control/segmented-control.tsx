"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** 顯示在文字前的圖示，例如顏色色票 */
  icon?: ReactNode;
  /** 只顯示圖示時，提供給螢幕閱讀器的名稱 */
  ariaLabel?: string;
  /** 停用（例如售完），文字會劃線 */
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  /** 受控值 */
  value?: T;
  /** 非受控時的初始值，預設為第一個可用選項 */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  size?: "sm" | "md" | "lg";
  /** 撐滿父層寬度，各選項等寬 */
  fullWidth?: boolean;
  /** 只顯示圖示，文字改為 aria-label */
  iconOnly?: boolean;
  /** 整組的無障礙名稱 */
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

// 設計語言（DESIGN.md）：墨色外框標示選取，snappy 彈簧滑動
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

const sizes = {
  sm: { item: "h-8 min-w-9 px-2.5 gap-1.5 text-xs", icon: "[&_svg]:size-3.5", iconOnly: "size-8" },
  md: { item: "h-10 min-w-11 px-3.5 gap-2 text-sm", icon: "[&_svg]:size-4", iconOnly: "size-10" },
  lg: { item: "h-12 min-w-14 px-5 gap-2 text-base", icon: "[&_svg]:size-5", iconOnly: "size-12" },
};

export function SegmentedControl<T extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  fullWidth = false,
  iconOnly = false,
  "aria-label": ariaLabel = "Options",
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const firstEnabled = options.find((o) => !o.disabled)?.value;
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? firstEnabled);
  const selected = value ?? inner;
  const s = sizes[size];

  const select = (next: T) => {
    if (disabled) return;
    if (value === undefined) setInner(next);
    if (next !== selected) onValueChange?.(next);
  };

  // 方向鍵移動焦點並同時選取（radio 的標準行為），跳過停用項
  const move = (from: number, dir: 1 | -1 | "first" | "last") => {
    const n = options.length;
    let i = dir === "first" ? -1 : dir === "last" ? n : from;
    const step = dir === "first" ? 1 : dir === "last" ? -1 : dir;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (!options[i].disabled) {
        refs.current[i]?.focus();
        select(options[i].value);
        return;
      }
    }
  };

  const keyMap: Record<string, 1 | -1 | "first" | "last"> = {
    ArrowRight: 1,
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowUp: -1,
    Home: "first",
    End: "last",
  };
  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = keyMap[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    move(i, dir);
  };

  // 沒有任何選取時，讓第一個可用項可被 Tab 聚焦
  const tabStop = options.some((o) => o.value === selected && !o.disabled) ? selected : firstEnabled;

  return (
    <LayoutGroup id={groupId}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        className={cn(
          "flex-wrap gap-2",
          fullWidth ? "flex w-full" : "inline-flex",
          ink,
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {options.map((o, i) => {
          const active = o.value === selected;
          const isDisabled = disabled || o.disabled;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={iconOnly ? (o.ariaLabel ?? (typeof o.label === "string" ? o.label : undefined)) : o.ariaLabel}
              disabled={isDisabled}
              tabIndex={o.value === tabStop ? 0 : -1}
              onClick={() => select(o.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-md border border-border font-medium whitespace-nowrap tabular-nums transition-colors outline-none select-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:text-current/35 disabled:line-through disabled:decoration-1",
                iconOnly ? s.iconOnly : s.item,
                s.icon,
                fullWidth && "flex-1",
                active ? "text-current" : "text-current/70 enabled:hover:border-current/40 enabled:hover:text-current",
              )}
            >
              {/* 唯一一個選取外框，在選項之間滑動 */}
              {active && (
                <motion.span
                  layoutId="variant-outline"
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-px rounded-[inherit] border-[1.5px] border-current"
                  transition={reduceMotion ? { duration: 0 } : snappy}
                />
              )}
              {o.icon && (
                <span aria-hidden="true" className="inline-flex shrink-0">
                  {o.icon}
                </span>
              )}
              {!iconOnly && <span>{o.label}</span>}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
