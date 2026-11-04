"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

export type LiveBentoSpan = "1x1" | "2x1" | "1x2" | "2x2";

export interface LiveBentoTile {
  id: string;
  title: ReactNode;
  body?: ReactNode;
  span?: LiveBentoSpan;
  /** 依共用 tick 畫出迷你動態；tick 為 0 時要是一張完整的靜態畫面 */
  visual: (tick: number) => ReactNode;
}

export interface LiveBentoProps {
  tiles: LiveBentoTile[];
  /** 共用節拍的間隔（毫秒） */
  periodMs?: number;
  className?: string;
}

/**
 * 整個 bento 共用一個節拍：不在畫面內、分頁隱藏或 reduced motion 時停止。
 * 傳入 target 時以該元素是否可見決定播放。
 */
export function useTicker(periodMs: number, target?: RefObject<Element | null>) {
  const reduce = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);
  const [inView, setInView] = useState(!target);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = target?.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const running = !reduce && inView && visible;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), periodMs);
    return () => clearInterval(id);
  }, [running, periodMs]);

  return reduce ? 0 : tick;
}

const spanClass: Record<LiveBentoSpan, string> = {
  "1x1": "",
  "2x1": "sm:col-span-2",
  "1x2": "sm:row-span-2",
  "2x2": "sm:col-span-2 sm:row-span-2",
};

export function LiveBento({ tiles, periodMs = 1600, className }: LiveBentoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useTicker(periodMs, ref);

  return (
    <div
      ref={ref}
      className={cn("grid auto-rows-[minmax(12rem,auto)] grid-cols-1 gap-3 [grid-auto-flow:dense] sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {tiles.map((tile) => (
        <article
          key={tile.id}
          className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 text-card-foreground", spanClass[tile.span ?? "1x1"])}
        >
          {/* 迷你動態只是示意，內容由標題與說明承擔 */}
          <div aria-hidden="true" className="flex min-h-24 flex-1 items-center justify-center">
            {tile.visual(tick)}
          </div>
          <h3 className="mt-4 text-sm font-semibold">{tile.title}</h3>
          {tile.body && <p className="mt-1 text-sm text-muted-foreground">{tile.body}</p>}
        </article>
      ))}
    </div>
  );
}
