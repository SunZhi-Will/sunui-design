"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { at, onFrame, paletteOf, puff, Spring, ticks, wob } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeTab = { value: string; label: string; content: ReactNode };

export type AnimeTabsProps = {
  tabs: AnimeTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name of the tab list */
  label: string;
  className?: string;
};

/**
 * Tabs where the raised tab slides to the new one on a spring, stretching with speed, and lands with accent wedges,
 * wobble marks and a puff. Keyboard follows the tabs pattern: arrow keys, Home and End move and select.
 */
export function AnimeTabs({ tabs, value, defaultValue, onValueChange, label, className }: AnimeTabsProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.value);
  const current = value ?? own;
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const x = useRef(new Spring(0, 360, 26));
  const w = useRef(new Spring(0, 360, 26));
  const stop = useRef<(() => void) | null>(null);
  const first = useRef(true);

  const paint = (stretch = 1) => {
    if (!pill.current) return;
    pill.current.style.width = `${w.current.x}px`;
    pill.current.style.transform = `translateX(${x.current.x}px) scaleX(${stretch.toFixed(3)})`;
  };

  useLayoutEffect(() => {
    const b = buttons.current[current];
    const host = list.current;
    if (!b || !host) return;
    const left = b.offsetLeft;
    const width = b.offsetWidth;
    // First paint and resizes: jump there; a change of tab: travel on the spring and land with effects
    if (first.current) {
      first.current = false;
      x.current.x = x.current.to = left;
      w.current.x = w.current.to = width;
      paint();
      return;
    }
    x.current.to = left;
    w.current.to = width;
    const dir = left > x.current.x ? 1 : -1;
    let landed = false;
    stop.current?.();
    stop.current = onFrame((dt) => {
      x.current.step(dt);
      w.current.step(dt);
      paint(1 + Math.min(0.25, Math.abs(x.current.v) / 4000));
      if (!landed && Math.abs(x.current.x - left) < 3 && pill.current) {
        landed = true;
        const P = paletteOf(pill.current);
        const c = at(pill.current);
        ticks(P, c.x, c.y - c.h / 2 - 2, { n: 3, r: 4, len: 10, fan: 0.5 });
        wob(P, c.x + dir * (c.w / 2 + 6), c.y, { dir, r: 9, life: 0.35 });
        // Dust below the tab list, so it never drifts over the tab labels
        puff(P, c.x - dir * (c.w / 2), c.y + c.h / 2 + 12, { size: 6, n: 4, vx: -dir * 22, vy: 4, life: 0.5 });
      }
      if (x.current.still && w.current.still) {
        stop.current?.();
        stop.current = null;
        paint();
      }
    });
  }, [current]);
  useEffect(() => () => stop.current?.(), []);

  const select = (v: string) => {
    if (value === undefined) setOwn(v);
    onValueChange?.(v);
  };

  const key = (e: KeyboardEvent, i: number) => {
    const n = tabs.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next].value);
    buttons.current[tabs[next].value]?.focus();
  };

  return (
    <div className={cn("w-full", className)}>
      <div ref={list} role="tablist" aria-label={label} className="relative inline-flex rounded-[14px] border-[3px] border-foreground bg-card p-1">
        <span
          ref={pill}
          aria-hidden
          className="absolute top-1 bottom-1 left-0 origin-center rounded-[10px] border-[3px] border-foreground bg-card shadow-[3px_4px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))] will-change-transform"
        />
        {tabs.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => void (buttons.current[t.value] = el)}
            id={`${id}-t-${t.value}`}
            type="button"
            role="tab"
            aria-selected={current === t.value}
            aria-controls={`${id}-p-${t.value}`}
            tabIndex={current === t.value ? 0 : -1}
            onClick={() => select(t.value)}
            onKeyDown={(e) => key(e, i)}
            className={cn(
              "relative z-10 rounded-[10px] px-4 py-2 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]",
              current === t.value ? "font-extrabold italic" : "font-semibold text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.value} id={`${id}-p-${t.value}`} role="tabpanel" aria-labelledby={`${id}-t-${t.value}`} hidden={current !== t.value} tabIndex={0} className="mt-5 outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))] rounded-lg">
          {t.content}
        </div>
      ))}
    </div>
  );
}
