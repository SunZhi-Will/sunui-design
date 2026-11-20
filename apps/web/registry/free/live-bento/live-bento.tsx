"use client";

// 功能 Bento 格：每一格有一個小型示意畫面，示範該功能怎麼運作。
// 格子本身不做進場動畫（DESIGN.md 5.2）：一捲到就已經在那裡。
// 小畫面是內容，可以重播，但只在進入畫面且分頁可見時播放；減少動態效果時停在資訊完整的最後一格。
// 懸停時從 e1 升到 e2：兩層陰影疊在一起切換透明度，陰影本身不做動畫。

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 三種彈簧，格子裡的小畫面用 framer-motion 時只用這三種 */
export const springs = {
  /** 按壓回饋、小元件位移 */
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  /** 狀態切換、展開收合 */
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  /** 小元件落定一次的回彈 */
  pop: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

function useReducedMotionPref() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * 小畫面的節拍器：在畫面內且分頁可見時，每 period 毫秒前進一步，走到 steps 後從 0 重來。
 * 起始與減少動態效果時停在最後一步，所以最後一步要畫成資訊完整的樣子。
 * 把回傳的 ref 掛在小畫面的外層。
 */
export function useTicker(period: number, steps: number) {
  const reduced = useReducedMotionPref();
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(steps - 1);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const playing = inView && visible && !reduced;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % steps), period);
    return () => window.clearInterval(timer);
  }, [playing, period, steps]);

  return { ref, step: reduced ? steps - 1 : step, playing, reduced };
}

const E1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";
const E2 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)] dark:bg-foreground/[0.03]";

export interface BentoTileProps {
  title: ReactNode;
  body?: ReactNode;
  /** md 以上橫跨兩欄 */
  wide?: boolean;
  className?: string;
  /** 小畫面。只是示意，會被標成 aria-hidden，意思要由 title 與 body 說完 */
  children: ReactNode;
}

export function BentoTile({ title, body, wide, className, children }: BentoTileProps) {
  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col rounded-xl bg-card p-1 text-card-foreground",
        E1,
        wide && "md:col-span-2",
        className,
      )}
    >
      {/* e2 疊在 e1 上，懸停時淡入（進 0ms、退 150ms）；深色模式改成表面提亮一階 */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:duration-0",
          E2,
        )}
      />
      <div className="relative px-5 pb-4 pt-5">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {body ? <p className="mt-1.5 text-pretty text-sm text-muted-foreground">{body}</p> : null}
      </div>
      {/* 凹面的展示區：卡片 12px、內距 4px，所以 8px */}
      <div
        aria-hidden
        className="relative flex min-h-44 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-muted p-5 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]"
      >
        {children}
      </div>
    </article>
  );
}

export function LiveBento({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
