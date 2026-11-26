"use client";

import { useEffect, useRef } from "react";

import { at, burst, later, lines, onFrame, paletteOf, puff, sfx, shards, Spring, type SfxLang } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeProgressProps = {
  /** Current value, from 0 to max */
  value: number;
  max?: number;
  label: string;
  /** Shown in place of the percentage once the value reaches max */
  doneLabel?: string;
  /** Lettering language; defaults to <html lang> (Chinese pages get Chinese, others Japanese) */
  lang?: SfxLang;
  /** Show the sound-effect words (a rumble when it starts, a hit when it finishes) */
  lettering?: boolean;
  className?: string;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

/**
 * A progress bar that charges like an anime power-up: a rumble word when it starts, the fill surges on a spring with dust
 * kicked up at its leading edge, and at the end an impact star, chips and a hit word, settling on a check.
 * The number and aria-valuenow always show the real value; only the fill is sprung.
 */
export function AnimeProgress({ value, max = 100, label, doneLabel = "Done", lang, lettering = true, className }: AnimeProgressProps) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const spring = useRef(new Spring(0, 140, 18));
  const prev = useRef<number | null>(null);
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const done = ratio >= 1;
  const pct = Math.round(ratio * 100);

  useEffect(() => {
    const el = bar.current;
    const s = spring.current;
    // First render: show the current value as it is, with no effects (a page that loads at 40% is not a surge)
    if (prev.current === null) {
      prev.current = ratio;
      s.x = s.to = ratio;
      if (fill.current) fill.current.style.width = `${ratio * 100}%`;
      return;
    }
    const from = prev.current;
    prev.current = ratio;
    if (!el) return;
    s.to = ratio;
    const stop = onFrame((dt) => {
      const x = Math.max(0, Math.min(1, s.step(dt)));
      if (fill.current) fill.current.style.width = `${x * 100}%`;
      if (s.still) stop();
    });
    if (ratio <= from) return stop;
    const P = paletteOf(el);
    if (from === 0 && lettering) {
      // Words sit above the label row, never on the label or the number
      const top = at(root.current ?? el, 0.5, 0);
      sfx(P, "rumble", top.x, top.y - 22, { size: 40, lang, rot: -0.06, life: 1.1 });
    }
    // Dust at the leading edge once the surge has mostly arrived
    later(140, () => {
      if (!el.isConnected) return;
      const edge = at(el, ratio, 0.5);
      puff(P, edge.x, edge.y + edge.h / 2, { size: 6, n: 4, vx: 10, vy: -16, life: 0.55 });
      lines(P, edge.x - 6, edge.y, { n: 3, dir: Math.PI, len: 22, spread: 6, life: 0.22 });
    });
    if (ratio >= 1)
      later(420, () => {
        if (!el.isConnected) return;
        const end = at(el, 1, 0.5);
        burst(P, end.x, end.y, { r: 46, spikes: 11, life: 0.4 });
        shards(P, end.x, end.y, { n: 6, speed: 160, size: 5, life: 0.6 });
        const corner = at(root.current ?? el, 1, 0);
        if (lettering) sfx(P, "impact", corner.x - 24, corner.y - 30, { size: 60, lang, life: 0.95 });
      });
    return stop;
  }, [ratio, lang, lettering]);

  return (
    <div ref={root} className={cn("w-full max-w-xs", className)}>
      <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
        <span className="font-bold">{label}</span>
        <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
          {done && (
            <svg viewBox="0 0 24 24" aria-hidden className="size-4">
              <path d="M4 12.5l5.5 5.5L20 6" fill="none" stroke="var(--sunui-success, currentColor)" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {done ? doneLabel : `${pct}%`}
        </span>
      </div>
      <div ref={bar} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn("relative h-4 overflow-hidden rounded-full p-[2px]", SHELL)}>
        <div ref={fill} className="h-full w-0 rounded-full bg-[var(--sunui-spot,var(--primary))]" />
      </div>
    </div>
  );
}
