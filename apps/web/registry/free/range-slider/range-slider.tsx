"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

type RangeValue = number | [number, number];

export interface RangeSliderProps<V extends RangeValue = RangeValue> {
  /** 傳數字是單值；傳 [低, 高] 是區間 */
  value?: V;
  defaultValue?: V;
  /** 拖曳中持續呼叫 */
  onValueChange?: (value: V) => void;
  /** 放開或鍵盤操作後呼叫一次，適合拿來送出篩選 */
  onValueCommit?: (value: V) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 區間模式下兩個把手至少相隔多少 */
  minGap?: number;
  /** 顯示數值的格式，例如 (n) => `$${n}` */
  format?: (n: number) => ReactNode;
  /** 刻度：數字代表等分幾格，陣列代表指定位置 */
  ticks?: number | number[];
  /** 拖曳時在把手上方顯示數值 */
  showTooltip?: boolean;
  label?: ReactNode;
  /** 表單欄位名稱；區間會送出 name-min 與 name-max */
  name?: string;
  /** 把手的 aria-label，區間模式依序為 [低, 高] */
  thumbLabels?: [string, string] | string;
  disabled?: boolean;
  className?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function RangeSlider<V extends RangeValue>({
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  format = (n) => n,
  ticks,
  showTooltip = true,
  label,
  name,
  thumbLabels,
  disabled = false,
  className,
}: RangeSliderProps<V>) {
  const reduce = useReducedMotion();
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<RangeValue>(defaultValue ?? valueProp ?? min);
  const current = (valueProp ?? inner) as RangeValue;
  const range = Array.isArray(current);
  const values: number[] = range ? [...current] : [current];
  const [dragging, setDragging] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const latest = useRef(values);
  latest.current = values;

  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  const snap = (n: number) => clamp(Math.round((n - min) / step) * step + min, min, max);
  const decimals = (String(step).split(".")[1] ?? "").length;

  const emit = useCallback(
    (next: number[], commit = false) => {
      const out = (range ? [next[0], next[1]] : next[0]) as V;
      if (valueProp === undefined) setInner(out);
      onValueChange?.(out);
      if (commit) onValueCommit?.(out);
    },
    [range, valueProp, onValueChange, onValueCommit],
  );

  const setThumb = (index: number, raw: number, commit = false) => {
    const next = [...latest.current];
    let v = Number(snap(raw).toFixed(decimals));
    if (range) v = index === 0 ? Math.min(v, next[1] - minGap) : Math.max(v, next[0] + minGap);
    if (next[index] === v && !commit) return;
    next[index] = v;
    latest.current = next;
    emit(next, commit);
  };

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min);
  };

  const onTrackDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const raw = fromPointer(e.clientX);
    const index = !range ? 0 : raw <= values[0] ? 0 : raw >= values[1] ? 1 : raw - values[0] < values[1] - raw ? 0 : 1;
    setDragging(index);
    setThumb(index, raw);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    trackRef.current?.querySelectorAll<HTMLElement>("[role=slider]")[index]?.focus();
  };

  const onTrackMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging === null) return;
    setThumb(dragging, fromPointer(e.clientX));
  };

  const onTrackUp = () => {
    if (dragging === null) return;
    emit(latest.current, true);
    setDragging(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    const big = Math.max(step, (max - min) / 10);
    const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
    let target: number | undefined;
    if (e.key in map) target = values[index] + map[e.key];
    if (e.key === "Home") target = min;
    if (e.key === "End") target = max;
    if (target === undefined) return;
    e.preventDefault();
    setThumb(index, target, true);
  };

  const tickList = typeof ticks === "number" ? Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks) : ticks ?? [];
  const lo = range ? pct(values[0]) : 0;
  const hi = pct(range ? values[1] : values[0]);
  const t = reduce || dragging !== null ? { duration: 0 } : springs.snappy;
  const labels = typeof thumbLabels === "string" ? [thumbLabels, thumbLabels] : thumbLabels ?? ["Minimum", "Maximum"];

  return (
    <div className={cn("w-full select-none", disabled && "pointer-events-none opacity-50", className)}>
      {label && (
        <div className="mb-3 flex items-baseline justify-between gap-3 text-sm">
          <span id={labelId} className="font-medium">
            {label}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {format(values[0])}
            {range && <> – {format(values[1])}</>}
          </span>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-6 cursor-pointer touch-none"
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackUp}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e7e0d0] dark:bg-[#38332b]" />
        <motion.div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#1c1917] dark:bg-[#ece7dc]"
          initial={false}
          animate={{ left: `${lo}%`, width: `${hi - lo}%` }}
          transition={t}
        />
        {tickList.map((tick) => (
          <span
            key={tick}
            aria-hidden="true"
            className={cn("absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full", pct(tick) >= lo && pct(tick) <= hi ? "bg-[#faf7f0] dark:bg-[#1f1c18]" : "bg-[#1c1917]/30 dark:bg-[#ece7dc]/30")}
            style={{ left: `${pct(tick)}%` }}
          />
        ))}
        {values.map((v, i) => (
          <motion.div
            key={i}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={range ? labels[i] : typeof thumbLabels === "string" ? thumbLabels : undefined}
            aria-labelledby={!range && !thumbLabels && label ? labelId : undefined}
            aria-valuemin={range && i === 1 ? values[0] + minGap : min}
            aria-valuemax={range && i === 0 ? values[1] - minGap : max}
            aria-valuenow={v}
            aria-valuetext={typeof format(v) === "string" || typeof format(v) === "number" ? String(format(v)) : undefined}
            aria-disabled={disabled || undefined}
            onKeyDown={(e) => onKeyDown(e, i)}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            className="absolute top-1/2 z-10 -ml-2.5 -mt-2.5 size-5 rounded-full border-[1.5px] border-[#1c1917] bg-[#faf7f0] outline-offset-2 focus-visible:outline-2 dark:border-[#ece7dc] dark:bg-[#1f1c18]"
            initial={false}
            animate={{ left: `${pct(v)}%`, scale: dragging === i && !reduce ? 1.15 : 1 }}
            transition={t}
            style={{ zIndex: dragging === i || focused === i ? 20 : 10 }}
          >
            {showTooltip && (dragging === i || focused === i) && (
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-[#e7e0d0] bg-[#faf7f0] px-1.5 py-0.5 text-xs tabular-nums text-[#1c1917] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
                {format(v)}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      {name && (
        <>
          <input type="hidden" name={range ? `${name}-min` : name} value={values[0]} />
          {range && <input type="hidden" name={`${name}-max`} value={values[1]} />}
        </>
      )}
    </div>
  );
}
