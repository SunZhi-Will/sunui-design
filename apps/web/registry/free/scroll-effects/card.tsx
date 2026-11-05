"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { CircleReveal, HorizontalScroll, ScrollMarquee, SplitDoors } from "./scroll-effects";

const STAGE = "150px";

const copy = {
  en: { horizontal: "Horizontal", circle: "Circle reveal", marquee: "Marquee", doors: "Split doors", rows: ["Scroll", "Motion"], open: "Open" },
  "zh-TW": { horizontal: "橫向捲動", circle: "圓形揭露", marquee: "跑馬燈", doors: "雙門滑開", rows: ["捲動", "動效"], open: "開門" },
  "zh-CN": { horizontal: "横向滚动", circle: "圆形揭示", marquee: "跑马灯", doors: "双门滑开", rows: ["滚动", "动效"], open: "开门" },
  ja: { horizontal: "横スクロール", circle: "サークル", marquee: "マーキー", doors: "スプリットドア", rows: ["スクロール", "モーション"], open: "開く" },
};

/** 型錄縮圖：用自動來回的進度代替捲動，展示四種效果 */
export default function ScrollEffectsCard() {
  const t = useDemoText(copy);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion() ?? false;
  const progress = useMotionValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      progress.set(1);
      return;
    }
    if (!inView) return;
    const c = animate(progress, [0, 1], { duration: 3.2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror", repeatDelay: 0.6 });
    return () => c.stop();
  }, [inView, reduce, progress]);

  const common = { progress, stageHeight: STAGE };
  const tile = "relative overflow-hidden rounded-lg border border-border bg-background";
  const label = "absolute left-2 top-2 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium";

  return (
    <div ref={ref} className="grid w-full max-w-md grid-cols-2 gap-2 text-foreground">
      <div className={tile}>
        <span className={label}>{t.horizontal}</span>
        <HorizontalScroll {...common} panelClassName="w-24">
          {[90, 60, 35, 70].map((n) => (
            <div key={n} className="h-20 rounded-md" style={{ background: `color-mix(in oklab, var(--primary) ${n}%, var(--muted))` }} />
          ))}
        </HorizontalScroll>
      </div>
      <div className={tile}>
        <span className={label}>{t.circle}</span>
        <CircleReveal {...common} front={<div className="size-full bg-muted" />}>
          <div className="size-full bg-primary" />
        </CircleReveal>
      </div>
      <div className={tile} style={{ height: STAGE }}>
        <span className={label}>{t.marquee}</span>
        <ScrollMarquee {...common} rows={t.rows} distance={40} rowClassName="text-4xl sm:text-4xl" className="pt-9" />
      </div>
      <div className={tile}>
        <span className={label}>{t.doors}</span>
        <SplitDoors {...common} cover={<div className="grid size-full place-items-center text-xl font-semibold">{t.open}</div>}>
          <div className="size-full" style={{ background: "linear-gradient(135deg, var(--primary), var(--muted))" }} />
        </SplitDoors>
      </div>
    </div>
  );
}
