"use client";

import { useEffect, useRef, useState } from "react";

import { at, calm, later, onFrame, paletteOf, puff, Spring, wob } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeLoaderProps = {
  /** Read out to screen readers and shown under the bar unless hideLabel */
  label?: string;
  hideLabel?: boolean;
  className?: string;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

/**
 * A waiting indicator for when there is no number to show: an ink slug charges back and forth inside a track on a spring,
 * stretching with speed, and kicks up dust with wobble marks at each end. With reduced motion it is a still half bar.
 */
export function AnimeLoader({ label = "Loading", hideLabel = false, className }: AnimeLoaderProps) {
  const track = useRef<HTMLDivElement>(null);
  const slug = useRef<HTMLSpanElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (calm()) {
      setStill(true);
      return;
    }
    const s = new Spring(0, 90, 7);
    s.to = 1;
    let turned = false;
    const stop = onFrame((dt) => {
      const x = s.step(dt);
      const el = slug.current;
      const host = track.current;
      if (!el || !host) return;
      const travel = host.clientWidth - el.offsetWidth - 6;
      const stretch = 1 + Math.min(0.6, Math.abs(s.v) * 0.18);
      el.style.transform = `translateX(${(Math.max(0, Math.min(1, x)) * travel).toFixed(2)}px) scaleX(${stretch.toFixed(3)})`;
      // Turn around just before the end, so it overshoots into the wall and kicks up dust
      if (!turned && Math.abs(x - s.to) < 0.08) {
        turned = true;
        const P = paletteOf(host);
        const end = at(host, s.to, 0.5);
        const dir = s.to === 1 ? 1 : -1;
        wob(P, end.x + dir * 4, end.y, { dir, r: 9, life: 0.35 });
        puff(P, end.x - dir * 6, end.y + end.h / 2, { size: 6, n: 4, vx: -dir * 20, vy: -12, life: 0.55 });
        later(140, () => {
          s.to = s.to === 1 ? 0 : 1;
          turned = false;
        });
      }
    });
    return stop;
  }, []);

  return (
    <div role="status" className={cn("w-full max-w-xs", className)}>
      <div ref={track} className={cn("relative h-5 overflow-hidden rounded-full p-[3px]", SHELL)}>
        <span ref={slug} aria-hidden className={cn("block h-full w-1/4 origin-center rounded-full bg-[var(--sunui-spot,var(--primary))] will-change-transform", still && "w-1/2")} />
      </div>
      <p className={cn("mt-2 text-[13px] font-bold", hideLabel && "sr-only")}>{label}</p>
    </div>
  );
}
