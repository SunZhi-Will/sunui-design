"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

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
  labels?: {
    /** spinbutton 的無障礙名稱 */
    quantity?: string;
    decrement?: string;
    increment?: string;
    remove?: string;
  };
  className?: string;
}

const defaultLabels = {
  quantity: "Quantity",
  decrement: "Decrease quantity",
  increment: "Increase quantity",
  remove: "Remove item",
};

const sizeClass: Record<QuantityStepperSize, { root: string; button: string; field: string }> = {
  sm: { root: "h-8 rounded-lg", button: "w-8 [&_svg]:size-3.5", field: "w-9 text-sm" },
  md: { root: "h-10 rounded-xl", button: "w-10 [&_svg]:size-4", field: "w-11 text-base" },
};

function clampSnap(n: number, min: number, max: number, step: number) {
  if (!Number.isFinite(n)) return min;
  const snapped = Math.round((n - min) / step) * step + min;
  // 修正浮點誤差
  const fixed = Number(snapped.toFixed(6));
  return Math.min(max, Math.max(min, fixed));
}

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
  labels,
  className,
}: QuantityStepperProps) {
  const reduce = useReducedMotion() ?? false;
  const text = { ...defaultLabels, ...labels };
  const [inner, setInner] = useState(() => clampSnap(defaultValue ?? min, min, max, step));
  const value = valueProp ?? inner;
  const [draft, setDraft] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [announce, setAnnounce] = useState("");
  const valueRef = useRef(value);
  valueRef.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = sizeClass[size];

  const atMin = value <= min;
  const atMax = value >= max;
  const showRemove = removable && atMin;

  const set = (next: number) => {
    const v = clampSnap(next, min, max, step);
    if (v === valueRef.current) return false;
    setDirection(v > valueRef.current ? 1 : -1);
    valueRef.current = v;
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
    setAnnounce(`${text.quantity} ${v}`);
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
    if (Number.isNaN(parsed)) return;
    set(parsed);
  };

  const onFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const base = draft !== null && !Number.isNaN(parseFloat(draft)) ? parseFloat(draft) : value;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowUp":
        next = base + step;
        break;
      case "ArrowDown":
        next = base - step;
        break;
      case "PageUp":
        next = base + step * 10;
        break;
      case "PageDown":
        next = base - step * 10;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      case "Enter":
        e.preventDefault();
        commitDraft();
        return;
      case "Escape":
        if (draft !== null) {
          e.preventDefault();
          setDraft(null);
        }
        return;
    }
    if (next === null) return;
    e.preventDefault();
    setDraft(null);
    set(next);
  };

  const editing = draft !== null;
  const buttonClass = cn(
    "flex h-full shrink-0 items-center justify-center text-foreground transition-colors outline-none select-none touch-manipulation",
    "hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
    s.button,
  );

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden border border-border bg-card text-card-foreground",
        disabled && "opacity-60",
        s.root,
        className,
      )}
    >
      {showRemove ? (
        <button
          type="button"
          aria-label={text.remove}
          disabled={disabled}
          onClick={() => onRemove?.()}
          className={cn(buttonClass, "text-rose-600 hover:bg-rose-500/10 focus-visible:bg-rose-500/10 dark:text-rose-400")}
        >
          <motion.svg
            key="trash"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            initial={reduce ? false : { scale: 0.5, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
          </motion.svg>
        </button>
      ) : (
        <button
          type="button"
          aria-label={text.decrement}
          tabIndex={-1}
          disabled={disabled || atMin}
          {...pressHandlers(-step)}
          className={buttonClass}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
      )}

      <div className={cn("relative border-x border-border", s.field)}>
        <input
          type="text"
          inputMode="decimal"
          role="spinbutton"
          aria-label={text.quantity}
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
            "size-full bg-transparent text-center font-medium tabular-nums outline-none focus-visible:bg-muted/60",
            // 非編輯狀態時文字透明，由下方滾動數字顯示
            editing ? "text-foreground" : "text-transparent caret-foreground selection:bg-primary/20 selection:text-foreground",
          )}
        />
        {!editing && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden font-medium tabular-nums"
          >
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.span
                key={value}
                custom={direction}
                initial={reduce ? false : { y: `${direction * 100}%`, opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: `${direction * -100}%`, opacity: 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}
                className="block"
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label={text.increment}
        tabIndex={-1}
        disabled={disabled || atMax}
        {...pressHandlers(step)}
        className={buttonClass}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
