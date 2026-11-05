"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

export type QuantityStepperSize = "sm" | "md";

export interface QuantityStepperProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 在最小值時把減號換成垃圾桶，點擊呼叫 onRemove */
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  size?: QuantityStepperSize;
  /** 長按多久後開始連續增減（ms） */
  repeatDelay?: number;
  /** 連續增減的起始間隔（ms），之後會逐漸加速 */
  repeatInterval?: number;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<QuantityStepperLabels>;
  className?: string;
}

export interface QuantityStepperLabels {
  /** spinbutton 的無障礙名稱，也用在數量變動的朗讀 */
  quantity: string;
  decrement: string;
  increment: string;
  remove: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, QuantityStepperLabels> = {
  en: { quantity: "Quantity", decrement: "Decrease quantity", increment: "Increase quantity", remove: "Remove item" },
  "zh-TW": { quantity: "數量", decrement: "減少數量", increment: "增加數量", remove: "移除商品" },
  "zh-CN": { quantity: "数量", decrement: "减少数量", increment: "增加数量", remove: "移除商品" },
  ja: { quantity: "数量", decrement: "数量を減らす", increment: "数量を増やす", remove: "商品を削除" },
};

// 設計語言（DESIGN.md）：收據紙、紙邊虛線、墨色數字
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const dashed = "border-[#1c1917]/20 dark:border-[#ece7dc]/20";
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

const sizeClass: Record<QuantityStepperSize, { root: string; button: string; field: string }> = {
  sm: { root: "h-8", button: "w-8 [&_svg]:size-3.5", field: "w-9 text-sm" },
  md: { root: "h-10", button: "w-10 [&_svg]:size-4", field: "w-12 text-base" },
};

function clampSnap(n: number, min: number, max: number, step: number) {
  if (!Number.isFinite(n)) return min;
  // toFixed 修正浮點誤差
  const snapped = Number((Math.round((n - min) / step) * step + min).toFixed(6));
  return Math.min(max, Math.max(min, snapped));
}

const keyDelta = (key: string, step: number) =>
  ({ ArrowUp: step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 })[key];

export function QuantityStepper({
  value: valueProp,
  defaultValue,
  onValueChange,
  min = 1,
  max = 99,
  step = 1,
  removable = false,
  onRemove,
  disabled = false,
  size = "md",
  repeatDelay = 400,
  repeatInterval = 120,
  locale = "en",
  labels,
  className,
}: QuantityStepperProps) {
  const reduce = useReducedMotion() ?? false;
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [inner, setInner] = useState(() => clampSnap(defaultValue ?? min, min, max, step));
  const value = valueProp ?? inner;
  const [draft, setDraft] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [announce, setAnnounce] = useState("");
  const valueRef = useRef(value);
  valueRef.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = sizeClass[size];
  const showRemove = removable && value <= min;

  const set = (next: number) => {
    const v = clampSnap(next, min, max, step);
    if (v === valueRef.current) return false;
    setDirection(v > valueRef.current ? 1 : -1);
    valueRef.current = v;
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
    setAnnounce(`${t.quantity} ${v}`);
    return true;
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  // 長按：先跳一次，延遲後持續增減並逐步加速，到邊界自動停止
  const startRepeat = (delta: number) => {
    stop();
    if (!set(valueRef.current + delta)) return;
    let interval = repeatInterval;
    const tick = () => {
      if (!set(valueRef.current + delta)) return stop();
      interval = Math.max(35, interval * 0.88);
      timer.current = setTimeout(tick, interval);
    };
    timer.current = setTimeout(tick, repeatDelay);
  };

  const pressHandlers = (delta: number) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      startRepeat(delta);
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
    // 鍵盤觸發的 click（detail 為 0）才在這裡處理，滑鼠已由 pointerdown 處理
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) set(valueRef.current + delta);
    },
  });

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = parseFloat(draft);
    setDraft(null);
    if (!Number.isNaN(parsed)) set(parsed);
  };

  const onFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const base = draft !== null && !Number.isNaN(parseFloat(draft)) ? parseFloat(draft) : value;
    if (e.key === "Enter") return (e.preventDefault(), commitDraft());
    if (e.key === "Escape" && draft !== null) return (e.preventDefault(), setDraft(null));
    const delta = keyDelta(e.key, step);
    const next = e.key === "Home" ? min : e.key === "End" ? max : delta !== undefined ? base + delta : null;
    if (next === null) return;
    e.preventDefault();
    setDraft(null);
    set(next);
  };

  const editing = draft !== null;
  const buttonClass = cn(
    "flex h-full shrink-0 items-center justify-center text-current/60 transition-colors outline-none select-none touch-manipulation",
    "hover:text-current focus-visible:text-current focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    "disabled:cursor-not-allowed disabled:text-current/25",
    s.button,
  );

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-md border",
        paper,
        edge,
        ink,
        disabled && "opacity-60",
        s.root,
        className,
      )}
    >
      {showRemove ? (
        <button
          type="button"
          aria-label={t.remove}
          disabled={disabled}
          onClick={() => onRemove?.()}
          className={cn(buttonClass, "hover:text-[#c8361d] focus-visible:text-[#c8361d] dark:hover:text-[#ec6a4f] dark:focus-visible:text-[#ec6a4f]")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4.5 7h15M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
            <path d="M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
            <path d="M10 11v5M14 11v5" />
          </svg>
        </button>
      ) : (
        <button type="button" aria-label={t.decrement} tabIndex={-1} disabled={disabled || value <= min} {...pressHandlers(-step)} className={buttonClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" strokeLinejoin="round">
            <path d="M5 12h14" />
          </svg>
        </button>
      )}

      {/* 數字欄：左右虛線，像收據上的數量格 */}
      <div className={cn("relative border-x border-dashed", dashed, s.field)}>
        <input
          type="text"
          inputMode="decimal"
          role="spinbutton"
          aria-label={t.quantity}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={String(value)}
          disabled={disabled}
          autoComplete="off"
          value={editing ? draft : String(value)}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.\-]/g, ""))}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commitDraft}
          onKeyDown={onFieldKeyDown}
          className={cn(
            "size-full bg-transparent text-center font-mono font-medium tabular-nums outline-none focus-visible:bg-current/[0.04]",
            // 非編輯狀態時文字透明，由下方滾動數字顯示
            editing ? "text-current" : "text-transparent caret-current selection:bg-current/15",
          )}
        />
        {!editing && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden font-mono font-medium tabular-nums">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={value}
                initial={reduce ? false : { y: `${direction * 100}%`, opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: `${direction * -100}%`, opacity: 0 }}
                transition={reduce ? { duration: 0 } : snappy}
                className="block"
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </div>

      <button type="button" aria-label={t.increment} tabIndex={-1} disabled={disabled || value >= max} {...pressHandlers(step)} className={buttonClass}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
