"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  CircleReveal,
  HorizontalScroll,
  ParallaxLayers,
  ScrollDrawPath,
  ScrollMarquee,
  scrollEffects,
  SplitDoors,
  StackingCards,
  VelocitySkew,
  ZoomOnScroll,
  type ScrollEffectId,
} from "./scroll-effects";
import { Art, copy } from "./demo";

export const variants = scrollEffects;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "stacking-cards";

const STAGE = "220px";

/** 首頁型錄：一種捲動效果一張卡。跟型錄縮圖一樣用自動來回的進度代替捲動，靜態卡片也看得到 */
export default function ScrollEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const effect = variant as ScrollEffectId;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion() ?? false;
  const progress = useMotionValue(reduce ? 1 : 0);
  // velocity-skew 本身不位移，跟著進度往上捲一段，看起來像在捲動
  const listY = useTransform(progress, [0, 1], [0, -90]);

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

  const content = () => {
    switch (effect) {
      case "parallax":
        return (
          <ParallaxLayers {...common} distance={60}>
            <h3 className="rounded-lg bg-background/80 px-3 py-1.5 text-lg font-semibold tracking-tight">{t.parallaxTitle}</h3>
          </ParallaxLayers>
        );
      case "horizontal-scroll":
        return (
          <HorizontalScroll {...common} panelClassName="w-36">
            {t.panels.map((title, i) => (
              <div key={title} className="flex h-44 flex-col justify-end overflow-hidden rounded-lg border border-border bg-card">
                <div className="h-24">
                  <Art variant={i} />
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground tabular-nums">0{i + 1}</p>
                  <p className="text-sm font-semibold">{title}</p>
                </div>
              </div>
            ))}
          </HorizontalScroll>
        );
      case "zoom-on-scroll":
        return <ZoomOnScroll {...common} art={<Art variant={0} />} title={<span className="text-2xl">{t.zoomTitle}</span>} />;
      case "velocity-skew":
        return (
          <div className="overflow-hidden" style={{ height: STAGE }}>
            <motion.div style={reduce ? undefined : { y: listY }}>
              <VelocitySkew progress={progress} maxSkew={8} className="gap-3 px-5 py-5">
                {t.skewItems.map((item, i) => (
                  <div key={item} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground tabular-nums">0{i + 1}</p>
                    <p className="text-base font-semibold">{item}</p>
                  </div>
                ))}
              </VelocitySkew>
            </motion.div>
          </div>
        );
      case "scroll-marquee":
        return (
          <div className="flex items-center overflow-hidden" style={{ height: STAGE }}>
            <ScrollMarquee {...common} rows={t.rows} distance={40} rowClassName="text-4xl sm:text-4xl" />
          </div>
        );
      case "circle-reveal":
        return (
          <CircleReveal {...common} front={<div className="grid size-full place-items-center bg-muted text-lg font-semibold">{t.circleFront}</div>}>
            <div className="grid size-full place-items-center bg-primary text-lg font-semibold text-primary-foreground">{t.circleBack}</div>
          </CircleReveal>
        );
      case "split-doors":
        return (
          <SplitDoors {...common} cover={<div className="grid size-full place-items-center text-2xl font-semibold tracking-tight">{t.doorsCover}</div>}>
            <div className="relative size-full">
              <Art variant={1} />
              <p className="absolute inset-0 grid place-items-center text-lg font-semibold">{t.doorsInside}</p>
            </div>
          </SplitDoors>
        );
      case "stacking-cards":
        return (
          <StackingCards {...common} peek={10}>
            {t.cards.map((title, i) => (
              <div key={title} className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <Art variant={i} />
                </div>
                <p className="p-3 text-sm font-semibold">{title}</p>
              </div>
            ))}
          </StackingCards>
        );
      case "scroll-draw-path":
        return (
          <ScrollDrawPath {...common}>
            {t.path.map((step, i) => (
              <div key={step} className={i % 2 === 0 ? "flex h-[73px] items-center justify-start px-5" : "flex h-[73px] items-center justify-end px-5"}>
                <span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold shadow-sm">{step}</span>
              </div>
            ))}
          </ScrollDrawPath>
        );
    }
  };

  return (
    <div ref={ref} className="relative w-80 overflow-hidden rounded-lg border border-border bg-background text-foreground">
      {content()}
    </div>
  );
}
