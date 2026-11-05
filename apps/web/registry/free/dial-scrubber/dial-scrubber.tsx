"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type AnimationPlaybackControls } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type DialMark = { value: number; label: ReactNode; /** Plain text for screen readers. */ text?: string };

export type DialScrubberProps = {
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Labeled points such as years or sizes. When given, only marks are labeled on the ruler. */
  marks?: DialMark[];
  /** Steps between major (labeled) ticks. */
  majorEvery?: number;
  /** Unlabeled ticks drawn between two steps (visual only). */
  subdivisions?: number;
  /** Pixels between two steps. */
  spacing?: number;
  formatValue?: (value: number) => string;
  /** Hide the large readout above the ruler. */
  hideReadout?: boolean;
  label?: string;
  className?: string;
};

const settle = { type: "spring", stiffness: 320, damping: 34 } as const;

export function DialScrubber({
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onChange,
  marks,
  majorEvery = 10,
  subdivisions = 0,
  spacing = 12,
  formatValue = (v) => String(v),
  hideReadout = false,
  label,
  className,
}: DialScrubberProps) {
  const reduce = useReducedMotion() ?? false;
  const count = Math.max(1, Math.round((max - min) / step));
  const toIndex = (v: number) => Math.min(count, Math.max(0, Math.round((v - min) / step)));
  const toValue = (i: number) => Number((min + Math.min(count, Math.max(0, Math.round(i))) * step).toFixed(6));

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => defaultValue ?? min);
  const current = controlled ? value : inner;

  const pos = useMotionValue(toIndex(current));
  const x = useTransform(pos, (p) => -p * spacing);
  const emitted = useRef(current);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<{ id: number; startX: number; startPos: number; lx: number; lt: number; v: number } | null>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const ticks = useRef<(HTMLSpanElement | null)[]>([]);
  const lit = useRef<number[]>([]);

  const commit = (v: number) => {
    if (v === emitted.current) return;
    emitted.current = v;
    if (!controlled) setInner(v);
    onChange?.(v);
  };

  const scaleTicks = (p: number) => {
    const next: number[] = [];
    for (let k = Math.floor(p) - 5; k <= Math.ceil(p) + 5; k++) {
      const el = ticks.current[k];
      if (!el) continue;
      const d = Math.abs(k - p);
      el.style.transform = `scaleY(${1 + 0.6 * Math.max(0, 1 - d / 5)})`;
      next.push(k);
    }
    for (const k of lit.current) if (!next.includes(k) && ticks.current[k]) ticks.current[k]!.style.transform = "";
    lit.current = next;
  };

  useMotionValueEvent(pos, "change", (p) => {
    scaleTicks(p);
    commit(toValue(p));
  });

  useEffect(() => {
    scaleTicks(pos.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (i: number, velocity = 0) => {
    const target = Math.min(count, Math.max(0, Math.round(i)));
    anim.current?.stop();
    if (reduce) {
      pos.set(target);
      return;
    }
    anim.current = animate(pos, target, { ...settle, velocity });
  };

  // 受控值從外面改變時，轉到新位置
  useEffect(() => {
    if (!controlled || drag.current) return;
    if (value === emitted.current) return;
    emitted.current = value;
    goTo(toIndex(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, controlled]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      anim.current?.stop();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      pos.set(Math.min(count, Math.max(0, pos.get() + delta / spacing)));
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => goTo(pos.get()), 120);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, spacing, reduce]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    anim.current?.stop();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, startX: e.clientX, startPos: pos.get(), lx: e.clientX, lt: e.timeStamp, v: 0 };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    let p = d.startPos - (e.clientX - d.startX) / spacing;
    // 超出兩端時加阻力
    if (p < 0) p = p / 3;
    if (p > count) p = count + (p - count) / 3;
    pos.set(p);
    const dt = Math.max(1, e.timeStamp - d.lt);
    d.v = d.v * 0.3 + (-(e.clientX - d.lx) / spacing / dt) * 0.7;
    d.lx = e.clientX;
    d.lt = e.timeStamp;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const v = e.timeStamp - d.lt > 80 || reduce ? 0 : d.v; // 步數 / ms
    goTo(pos.get() + v * 180, v * 1000);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = toIndex(emitted.current);
    const big = Math.max(1, majorEvery);
    const map: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowUp: i + 1,
      ArrowLeft: i - 1,
      ArrowDown: i - 1,
      PageUp: i + big,
      PageDown: i - big,
      Home: 0,
      End: count,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    goTo(map[e.key]);
  };

  const markAt = new Map((marks ?? []).map((m) => [toIndex(m.value), m]));
  const currentMark = markAt.get(toIndex(current));
  const valueText = currentMark ? `${formatValue(current)}, ${currentMark.text ?? (typeof currentMark.label === "string" ? currentMark.label : "")}`.replace(/, $/, "") : formatValue(current);

  const tickNodes: ReactNode[] = [];
  for (let k = 0; k <= count; k++) {
    const isMark = markAt.has(k);
    const major = isMark || k % Math.max(1, majorEvery) === 0;
    const showLabel = marks ? isMark : major;
    tickNodes.push(
      <div key={k} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: k * spacing }}>
        <span
          ref={(el) => {
            ticks.current[k] = el;
          }}
          className={cn(
            "block w-px origin-top rounded-full",
            isMark ? "h-9 w-0.5 bg-foreground" : major ? "h-7 bg-foreground/70" : "h-3.5 bg-muted-foreground/50",
          )}
        />
        {showLabel ? (
          <span className={cn("mt-3 whitespace-nowrap text-xs tabular-nums", isMark ? "font-medium text-foreground" : "text-muted-foreground")}>
            {isMark ? markAt.get(k)!.label : formatValue(toValue(k))}
          </span>
        ) : null}
      </div>,
    );
    if (subdivisions > 0 && k < count) {
      for (let s = 1; s <= subdivisions; s++) {
        tickNodes.push(
          <span
            key={`${k}-${s}`}
            className="absolute top-0 block h-2 w-px -translate-x-1/2 bg-muted-foreground/30"
            style={{ left: k * spacing + (s * spacing) / (subdivisions + 1) }}
          />,
        );
      }
    }
  }
  ticks.current.length = count + 1;

  return (
    <div className={cn("w-full select-none", className)}>
      {!hideReadout && (
        <div aria-hidden className="mb-4 text-center">
          <div className="text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{formatValue(current)}</div>
          {currentMark ? <div className="mt-1 text-sm text-muted-foreground">{currentMark.label}</div> : null}
        </div>
      )}
      <div
        ref={rootRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={valueText}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-24 cursor-grab touch-none overflow-hidden rounded-md outline-none [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)] focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <motion.div className="absolute left-1/2 top-4 h-full" style={{ x }}>
          {tickNodes}
        </motion.div>
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1 flex -translate-x-1/2 flex-col items-center">
          <svg width="12" height="8" viewBox="0 0 12 8" className="text-primary">
            <path d="M1 1h10L6 7z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className="block h-12 w-0.5 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

export default DialScrubber;
