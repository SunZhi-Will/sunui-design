"use client";

import { useEffect, useId, useRef, useState } from "react";

import { at, lines, onFrame, paletteOf, puff, sfx, Spring, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeSliderProps = {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
  disabled?: boolean;
  /** Text in the bubble and for screen readers, e.g. (v) => `${v}%` */
  format?: (value: number) => string;
  /** Lettering language; defaults to <html lang> */
  lang?: SfxLang;
  /** Show a swish word when a fast drag is let go. Off by default: above a slider it lands on the label row. */
  lettering?: boolean;
  className?: string;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[3px_4px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";
const THUMB = 26;

/**
 * A native range input (keys, forms and screen readers work as usual) drawn with a thumb that lags on a spring and stretches
 * into a teardrop with speed. A slow drag stays quiet; a fast one rolls smoke up behind the thumb, and letting go of a fast
 * drag fires speed lines ahead of it and a swish word.
 */
export function AnimeSlider({ label, value, defaultValue = 50, onValueChange, min = 0, max = 100, step = 1, name, disabled, format = (v) => String(v), lang, lettering = false, className }: AnimeSliderProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const ratio = max > min ? (current - min) / (max - min) : 0;
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const spring = useRef<Spring | null>(null);
  if (!spring.current) spring.current = new Spring(ratio, 300, 24);
  const stop = useRef<(() => void) | null>(null);
  const lastPuff = useRef(0);
  // The spring owns the thumb and fill after the first paint; React only sets where they start
  const [start] = useState(ratio);
  const fastest = useRef(0);

  const place = (x: number, stretch = 1, lean = 0) => {
    if (thumb.current) {
      thumb.current.style.left = `calc(${x * 100}% - ${x * THUMB}px)`;
      thumb.current.style.transform = `skewX(${lean.toFixed(1)}deg) scale(${stretch.toFixed(3)}, ${(1 / Math.sqrt(stretch)).toFixed(3)})`;
    }
    if (fill.current) fill.current.style.width = `calc(${x * 100}% - ${x * THUMB}px + ${THUMB / 2}px)`;
  };

  useEffect(() => {
    const s = spring.current!;
    s.to = ratio;
    if (stop.current) return;
    stop.current = onFrame((dt) => {
      const x = s.step(dt);
      const speed = Math.abs(s.v);
      fastest.current = Math.max(fastest.current * 0.96, speed);
      // Teardrop: stretch along the move and lean back against it, both from the spring's speed
      place(Math.max(0, Math.min(1, x)), 1 + Math.min(0.55, speed * 0.12), Math.max(-18, Math.min(18, -s.v * 4)));
      const el = thumb.current;
      const now = performance.now();
      if (el && speed > 2.2 && now - lastPuff.current > 70) {
        lastPuff.current = now;
        const c = at(el);
        puff(paletteOf(el), c.x - Math.sign(s.v) * 14, c.y + 6, { size: 7 + Math.min(6, speed), n: 4, vx: -Math.sign(s.v) * 26, vy: -14, life: 0.6 });
      }
      if (s.still) {
        stop.current?.();
        stop.current = null;
        place(ratio);
      }
    });
  }, [ratio]);
  useEffect(
    () => () => {
      stop.current?.();
      stop.current = null;
    },
    [],
  );

  // Letting go of a fast drag: speed lines ahead and a swish
  const release = () => {
    const el = thumb.current;
    const s = spring.current!;
    if (!el || fastest.current < 2.4) return;
    fastest.current = 0;
    const P = paletteOf(el);
    const c = at(el);
    const dir = s.v >= 0 ? 0 : Math.PI;
    lines(P, c.x + (s.v >= 0 ? 18 : -18), c.y, { n: 4, dir, len: 34, spread: 8, life: 0.3 });
    if (lettering) sfx(P, "swish", c.x, c.y - 52, { size: 44, lang, rot: s.v >= 0 ? -0.12 : 0.12, life: 0.75 });
  };

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="mb-3 flex items-center justify-between text-[13px]">
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        <span aria-hidden className="tabular-nums text-muted-foreground">
          {format(current)}
        </span>
      </div>
      <div ref={track} className={cn("relative h-[30px]", disabled && "opacity-45")}>
        <span aria-hidden className={cn("absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 rounded-full", SHELL)} />
        <span ref={fill} aria-hidden className="absolute top-1/2 left-0 ml-[3px] h-[10px] -translate-y-1/2 rounded-full bg-[var(--sunui-spot,var(--primary))]" style={{ width: `calc(${start * 100}% - ${start * THUMB}px + ${THUMB / 2}px)` }} />
        <input
          id={id}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          aria-valuetext={format(current)}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (value === undefined) setOwn(v);
            onValueChange?.(v);
          }}
          onPointerUp={release}
          onKeyUp={release}
          className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        />
        <span
          ref={thumb}
          aria-hidden
          className="absolute top-[2px] size-[26px] rounded-full border-[3px] border-foreground bg-card shadow-[2px_3px_0_var(--foreground)] will-change-transform peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--sunui-spot,var(--primary))] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
          style={{ left: `calc(${start * 100}% - ${start * THUMB}px)` }}
        />
      </div>
    </div>
  );
}
