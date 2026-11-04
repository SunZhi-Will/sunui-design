"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ToggleSwitchProps {
  /** 受控值 */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** default：一般開關；day-night：太陽與月亮切換、天空漸層與星星；icon：旋鈕內勾勾與叉叉互換 */
  variant?: "default" | "day-night" | "icon";
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 可見標籤，點擊標籤也會切換 */
  label?: ReactNode;
  /** 標籤下方的說明文字，會透過 aria-describedby 連結 */
  description?: ReactNode;
  /** 標籤在開關的哪一側 */
  labelPosition?: "start" | "end";
  /** 沒有可見標籤時必填 */
  "aria-label"?: string;
  disabled?: boolean;
  /** 提供時會輸出隱藏欄位，方便原生表單送出 */
  name?: string;
  id?: string;
  className?: string;
}

// 軌道與旋鈕尺寸（px），旋鈕距邊 pad
const dims = {
  sm: { w: 34, h: 20, knob: 16, pad: 2, icon: 10 },
  md: { w: 46, h: 26, knob: 22, pad: 2, icon: 12 },
  lg: { w: 58, h: 32, knob: 28, pad: 2, icon: 14 },
};

const stars = [
  { x: 0.18, y: 0.3, s: 2 },
  { x: 0.32, y: 0.62, s: 1.5 },
  { x: 0.44, y: 0.25, s: 1.5 },
  { x: 0.26, y: 0.78, s: 1 },
];

export function ToggleSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  variant = "default",
  size = "md",
  label,
  description,
  labelPosition = "start",
  "aria-label": ariaLabel,
  disabled = false,
  name,
  id,
  className,
}: ToggleSwitchProps) {
  const reduceMotion = useReducedMotion();
  const autoId = useId();
  const switchId = id ?? `${autoId}-switch`;
  const labelId = `${autoId}-label`;
  const descId = `${autoId}-desc`;
  const [inner, setInner] = useState(defaultChecked);
  const [pressed, setPressed] = useState(false);
  const on = checked ?? inner;
  const d = dims[size];

  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };

  // 按住時旋鈕拉長（squash and stretch），往目標方向延伸
  const squash = pressed && !reduceMotion && !disabled;
  const knobW = squash ? d.knob * 1.28 : d.knob;
  const knobX = on ? d.w - d.pad * 2 - knobW : 0;
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 700, damping: 32 };
  const fade = { duration: reduceMotion ? 0 : 0.25 };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) setPressed(true);
  };
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") setPressed(false);
  };

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      onClick={toggle}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      style={{ width: d.w, height: d.h, padding: d.pad }}
      className={cn(
        "relative inline-flex shrink-0 items-center overflow-hidden rounded-full transition-colors duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant !== "day-night" && (on ? "bg-primary" : "bg-muted ring-1 ring-border ring-inset"),
      )}
    >
      {variant === "day-night" && (
        <>
          {/* 白天與夜晚兩層天空，以透明度交叉淡入 */}
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-sky-300 to-sky-500" />
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-800"
            initial={false}
            animate={{ opacity: on ? 1 : 0 }}
            transition={fade}
          />
          {stars.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute rounded-full bg-white"
              style={{ left: s.x * d.w, top: s.y * d.h, width: s.s, height: s.s }}
              initial={false}
              animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.2 }}
              transition={{ ...fade, delay: on && !reduceMotion ? 0.08 + i * 0.05 : 0 }}
            />
          ))}
          {/* 白天的小雲朵 */}
          <motion.span
            aria-hidden="true"
            className="absolute rounded-full bg-white/80"
            style={{ right: d.w * 0.14, bottom: d.h * 0.2, width: d.h * 0.45, height: d.h * 0.22 }}
            initial={false}
            animate={{ opacity: on ? 0 : 1, y: on ? d.h * 0.4 : 0 }}
            transition={fade}
          />
        </>
      )}

      <motion.span
        aria-hidden="true"
        className={cn(
          "relative grid place-items-center overflow-hidden rounded-full shadow-sm",
          variant === "day-night" ? (on ? "bg-slate-200" : "bg-amber-300") : "bg-background",
          variant === "day-night" && "transition-colors duration-300",
        )}
        style={{ height: d.knob }}
        initial={false}
        animate={{ x: knobX, width: knobW }}
        transition={spring}
      >
        {variant === "day-night" && (
          // 月亮：一個與夜空同色的圓從右上滑入，把太陽咬成月牙
          <motion.span
            className="absolute rounded-full bg-slate-800"
            style={{ width: d.knob * 0.8, height: d.knob * 0.8 }}
            initial={false}
            animate={on ? { x: d.knob * 0.3, y: -d.knob * 0.22, scale: 1 } : { x: d.knob * 0.9, y: -d.knob * 0.7, scale: 0.4 }}
            transition={spring}
          />
        )}
        {variant === "icon" && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: d.icon, height: d.icon }}
            className={on ? "text-primary" : "text-muted-foreground"}
          >
            <AnimatePresence initial={false} mode="wait">
              {on ? (
                <motion.path
                  key="check"
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={reduceMotion ? undefined : { pathLength: 0 }}
                  transition={{ duration: 0.18 }}
                />
              ) : (
                <motion.path
                  key="cross"
                  d="M7 7l10 10M17 7L7 17"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={reduceMotion ? undefined : { pathLength: 0 }}
                  transition={{ duration: 0.18 }}
                />
              )}
            </AnimatePresence>
          </svg>
        )}
      </motion.span>
      {name && <input type="hidden" name={name} value={on ? "on" : "off"} />}
    </button>
  );

  if (!label && !description) return <span className={cn("inline-flex", className)}>{control}</span>;

  return (
    <div
      className={cn(
        "flex items-center gap-4",
        labelPosition === "end" && "flex-row-reverse justify-end",
        disabled && "opacity-70",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {label && (
          <label
            id={labelId}
            htmlFor={switchId}
            className={cn("block text-sm font-medium text-foreground", disabled ? "cursor-not-allowed" : "cursor-pointer")}
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descId} className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}
