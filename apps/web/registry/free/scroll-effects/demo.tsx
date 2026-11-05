"use client";

import { useId, useRef, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  CircleReveal,
  HorizontalScroll,
  ParallaxLayers,
  ScrollDrawPath,
  ScrollMarquee,
  SplitDoors,
  StackingCards,
  VelocitySkew,
  ZoomOnScroll,
  type ScrollEffectId,
} from "./scroll-effects";

const STAGE = "520px";

const copy = {
  en: {
    hint: "Scroll inside the frame",
    names: {
      parallax: "Parallax",
      "horizontal-scroll": "Horizontal scroll",
      "zoom-on-scroll": "Zoom on scroll",
      "velocity-skew": "Velocity skew",
      "scroll-marquee": "Scroll marquee",
      "circle-reveal": "Circle reveal",
      "split-doors": "Split doors",
      "stacking-cards": "Stacking cards",
      "scroll-draw-path": "Scroll draw path",
    } satisfies Record<ScrollEffectId, string>,
    parallaxTitle: "Three layers, three speeds",
    panels: ["Plan", "Build", "Ship", "Learn"],
    panelBody: "Keep scrolling down, the row moves sideways.",
    zoomTitle: "Fill the frame",
    skewItems: ["Scroll fast to tilt", "Stop to settle", "Springs bring it back"],
    rows: ["Scroll to slide", "Opposite ways", "Big type rows"],
    circleFront: "This section",
    circleBack: "The next one, revealed",
    doorsCover: "Open the doors",
    doorsInside: "Behind the doors",
    cards: ["First card", "Second card", "Third card"],
    cardBody: "Earlier cards scale down and dim as new ones stack on top.",
    path: ["Start here", "Follow the line", "Arrive"],
    end: "End of demo",
  },
  "zh-TW": {
    hint: "在框內捲動",
    names: {
      parallax: "視差",
      "horizontal-scroll": "橫向捲動",
      "zoom-on-scroll": "捲動放大",
      "velocity-skew": "速度傾斜",
      "scroll-marquee": "捲動跑馬燈",
      "circle-reveal": "圓形揭露",
      "split-doors": "雙門滑開",
      "stacking-cards": "堆疊卡片",
      "scroll-draw-path": "捲動畫線",
    } satisfies Record<ScrollEffectId, string>,
    parallaxTitle: "三個圖層，三種速度",
    panels: ["規劃", "製作", "上線", "回顧"],
    panelBody: "繼續往下捲，這一排會往旁邊移。",
    zoomTitle: "填滿整個畫面",
    skewItems: ["捲快一點會傾斜", "停下就回正", "由彈簧拉回來"],
    rows: ["捲動就滑動", "方向相反", "大字橫列"],
    circleFront: "目前這一段",
    circleBack: "下一段，被揭開了",
    doorsCover: "推開這扇門",
    doorsInside: "門後的內容",
    cards: ["第一張", "第二張", "第三張"],
    cardBody: "新卡片疊上來時，前面的卡會縮小並變暗。",
    path: ["從這裡開始", "沿著線走", "抵達"],
    end: "示範結束",
  },
  "zh-CN": {
    hint: "在框内滚动",
    names: {
      parallax: "视差",
      "horizontal-scroll": "横向滚动",
      "zoom-on-scroll": "滚动放大",
      "velocity-skew": "速度倾斜",
      "scroll-marquee": "滚动跑马灯",
      "circle-reveal": "圆形揭示",
      "split-doors": "双门滑开",
      "stacking-cards": "堆叠卡片",
      "scroll-draw-path": "滚动画线",
    } satisfies Record<ScrollEffectId, string>,
    parallaxTitle: "三个图层，三种速度",
    panels: ["规划", "制作", "上线", "复盘"],
    panelBody: "继续往下滚，这一排会往旁边移。",
    zoomTitle: "填满整个画面",
    skewItems: ["滚快一点会倾斜", "停下就回正", "由弹簧拉回来"],
    rows: ["滚动就滑动", "方向相反", "大字横排"],
    circleFront: "当前这一段",
    circleBack: "下一段，被揭开了",
    doorsCover: "推开这扇门",
    doorsInside: "门后的内容",
    cards: ["第一张", "第二张", "第三张"],
    cardBody: "新卡片叠上来时，前面的卡会缩小并变暗。",
    path: ["从这里开始", "沿着线走", "抵达"],
    end: "演示结束",
  },
  ja: {
    hint: "枠の中をスクロール",
    names: {
      parallax: "パララックス",
      "horizontal-scroll": "横スクロール",
      "zoom-on-scroll": "スクロールズーム",
      "velocity-skew": "速度スキュー",
      "scroll-marquee": "スクロールマーキー",
      "circle-reveal": "サークルリビール",
      "split-doors": "スプリットドア",
      "stacking-cards": "スタッキングカード",
      "scroll-draw-path": "スクロール描線",
    } satisfies Record<ScrollEffectId, string>,
    parallaxTitle: "3 つのレイヤー、3 つの速さ",
    panels: ["計画", "制作", "公開", "振り返り"],
    panelBody: "下へスクロールすると、列が横に動きます。",
    zoomTitle: "画面いっぱいに",
    skewItems: ["速く動かすと傾く", "止まると戻る", "スプリングで元どおり"],
    rows: ["スクロールで流れる", "逆向きに", "大きな文字の列"],
    circleFront: "このセクション",
    circleBack: "次のセクションが現れる",
    doorsCover: "扉を開けて",
    doorsInside: "扉の向こう側",
    cards: ["1 枚目", "2 枚目", "3 枚目"],
    cardBody: "新しいカードが重なると、前のカードは小さく暗くなります。",
    path: ["ここから", "線をたどって", "到着"],
    end: "デモはここまで",
  },
};

/** 黏在區段頂端的效果名稱標籤 */
function Labeled({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="relative border-b border-border">
      <div className="pointer-events-none sticky top-3 z-30 h-0 px-3">
        <span className="inline-block rounded-full border border-border bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {name}
        </span>
      </div>
      {children}
    </div>
  );
}

/** 純 CSS / SVG 的佔位畫面 */
function Art({ variant = 0 }: { variant?: number }) {
  const a = variant % 2 === 0 ? 80 : 30;
  const b = variant % 2 === 0 ? 25 : 70;
  const id = useId();
  return (
    <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="size-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`color-mix(in oklab, var(--primary) ${a}%, var(--background))`} />
          <stop offset="1" stopColor={`color-mix(in oklab, var(--primary) ${b}%, var(--background))`} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <circle cx="300" cy="90" r="42" fill="var(--background)" opacity="0.35" />
      <path d="M0 230 L90 150 L170 210 L260 130 L400 240 V300 H0Z" fill="var(--foreground)" opacity="0.18" />
    </svg>
  );
}

export default function ScrollEffectsDemo() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);
  const common = { container: scroller, stageHeight: STAGE };

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>{t.hint}</span>
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M8 3v10M4 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div ref={scroller} className="relative overflow-y-auto overscroll-contain" style={{ height: STAGE }}>
        <Labeled name={t.names.parallax}>
          <ParallaxLayers {...common}>
            <h3 className="rounded-lg bg-background/80 px-4 py-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.parallaxTitle}</h3>
          </ParallaxLayers>
        </Labeled>

        <Labeled name={t.names["horizontal-scroll"]}>
          <HorizontalScroll {...common}>
            {t.panels.map((title, i) => (
              <div key={title} className="flex h-72 flex-col justify-end overflow-hidden rounded-xl border border-border bg-card">
                <div className="h-40">
                  <Art variant={i} />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground tabular-nums">0{i + 1}</p>
                  <p className="text-lg font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{t.panelBody}</p>
                </div>
              </div>
            ))}
          </HorizontalScroll>
        </Labeled>

        <Labeled name={t.names["zoom-on-scroll"]}>
          <ZoomOnScroll {...common} art={<Art variant={0} />} title={t.zoomTitle} />
        </Labeled>

        <Labeled name={t.names["velocity-skew"]}>
          <VelocitySkew {...common} className="px-6 py-16">
            {t.skewItems.map((item, i) => (
              <div key={item} className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground tabular-nums">0{i + 1}</p>
                <p className="text-xl font-semibold">{item}</p>
              </div>
            ))}
          </VelocitySkew>
        </Labeled>

        <Labeled name={t.names["scroll-marquee"]}>
          <ScrollMarquee {...common} rows={t.rows} className="py-16" />
        </Labeled>

        <Labeled name={t.names["circle-reveal"]}>
          <CircleReveal
            {...common}
            front={<div className="grid size-full place-items-center bg-muted text-2xl font-semibold">{t.circleFront}</div>}
          >
            <div className="grid size-full place-items-center bg-primary text-2xl font-semibold text-primary-foreground">{t.circleBack}</div>
          </CircleReveal>
        </Labeled>

        <Labeled name={t.names["split-doors"]}>
          <SplitDoors
            {...common}
            cover={<div className="grid size-full place-items-center text-3xl font-semibold tracking-tight sm:text-5xl">{t.doorsCover}</div>}
          >
            <div className="relative size-full">
              <Art variant={1} />
              <p className="absolute inset-0 grid place-items-center text-2xl font-semibold">{t.doorsInside}</p>
            </div>
          </SplitDoors>
        </Labeled>

        <Labeled name={t.names["stacking-cards"]}>
          <StackingCards {...common}>
            {t.cards.map((title, i) => (
              <div key={title} className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <Art variant={i} />
                </div>
                <div className="p-5">
                  <p className="text-lg font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{t.cardBody}</p>
                </div>
              </div>
            ))}
          </StackingCards>
        </Labeled>

        <Labeled name={t.names["scroll-draw-path"]}>
          <ScrollDrawPath {...common}>
            {t.path.map((step, i) => (
              <div key={step} className={i % 2 === 0 ? "flex h-64 items-center justify-start px-8" : "flex h-64 items-center justify-end px-8"}>
                <span className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-semibold shadow-sm">{step}</span>
              </div>
            ))}
          </ScrollDrawPath>
        </Labeled>

        <p className="py-16 text-center text-sm text-muted-foreground">{t.end}</p>
      </div>
    </div>
  );
}
