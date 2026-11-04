"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** 顯示在文字前的圖示 */
  icon?: ReactNode;
  /** 只顯示圖示時，提供給螢幕閱讀器的名稱 */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  /** 受控值 */
  value?: T;
  /** 非受控時的初始值，預設為第一個可用選項 */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 撐滿父層寬度，各段等寬 */
  fullWidth?: boolean;
  /** 只顯示圖示，文字改為 aria-label */
  iconOnly?: boolean;
  /** 整組的無障礙名稱 */
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

const sizes = {
  sm: { root: "h-8 p-0.5 text-xs", item: "px-2.5 gap-1.5", icon: "[&_svg]:size-3.5", iconOnly: "w-7" },
  md: { root: "h-10 p-1 text-sm", item: "px-3.5 gap-2", icon: "[&_svg]:size-4", iconOnly: "w-8" },
  lg: { root: "h-12 p-1 text-base", item: "px-5 gap-2", icon: "[&_svg]:size-5", iconOnly: "w-10" },
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

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, 1 | -1 | "first" | "last"> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: "first",
      End: "last",
    };
    const dir = map[e.key];
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
          "relative isolate inline-flex items-stretch rounded-xl bg-muted text-muted-foreground",
          s.root,
          fullWidth && "flex w-full",
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
                "relative inline-flex items-center justify-center rounded-[calc(0.75rem-0.25rem)] font-medium whitespace-nowrap transition-colors outline-none select-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                iconOnly ? s.iconOnly : s.item,
                s.icon,
                fullWidth && "flex-1",
                active ? "text-foreground" : "hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="segmented-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-[inherit] bg-background shadow-sm ring-1 ring-border/60"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              {o.icon && <span aria-hidden="true" className="inline-flex shrink-0">{o.icon}</span>}
              {!iconOnly && <span>{o.label}</span>}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
