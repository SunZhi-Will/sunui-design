"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ImageEffect, Lightbox, SliceSlideshow, imageEffects, type ImageEffectName, type ImageItem } from "./image-effects";

// 示範用的佔位插畫：SVG data URI，不讀任何外部圖片
const palettes = [
  ["#0f766e", "#99f6e4", "#fde68a", "#134e4a"],
  ["#b45309", "#fde68a", "#fff7ed", "#78350f"],
  ["#1d4ed8", "#bfdbfe", "#f8fafc", "#1e3a8a"],
  ["#15803d", "#bbf7d0", "#fef9c3", "#14532d"],
  ["#c2410c", "#fed7aa", "#fef3c7", "#7c2d12"],
  ["#334155", "#cbd5e1", "#f1f5f9", "#0f172a"],
];

export function demoArt(i: number) {
  const [a, b, sun, dark] = palettes[i % palettes.length];
  const cx = 180 + ((i * 137) % 440);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${b}'/><stop offset='1' stop-color='${a}'/></linearGradient></defs><rect width='800' height='600' fill='url(#g)'/><circle cx='${cx}' cy='200' r='72' fill='${sun}'/><circle cx='${cx}' cy='200' r='110' fill='${sun}' opacity='.25'/><path d='M0 420 L${150 + i * 20} 250 L330 400 L${470 - i * 15} 240 L800 440 V600 H0Z' fill='${dark}' opacity='.5'/><path d='M0 500 L220 370 L420 480 L620 350 L800 470 V600 H0Z' fill='${dark}'/><g fill='${dark}'><rect x='90' y='455' width='14' height='60'/><path d='M97 400 L130 470 H64Z'/><rect x='690' y='445' width='12' height='50'/><path d='M696 395 L724 460 H668Z'/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const copy = {
  en: {
    hover: "Hover",
    scroll: "Scroll",
    loop: "Loop",
    entrance: "Entrance",
    click: "Click",
    replay: "Replay",
    close: "Close",
    caption: "Harbor at dusk, 6:40 pm",
    alts: ["Teal lagoon", "Amber desert", "Blue fjord", "Green valley", "Orange canyon", "Slate peaks"],
  },
  "zh-TW": {
    hover: "滑過",
    scroll: "捲動",
    loop: "循環",
    entrance: "進場",
    click: "點擊",
    replay: "重播",
    close: "關閉",
    caption: "黃昏的港口，下午 6:40",
    alts: ["青綠潟湖", "琥珀沙漠", "藍色峽灣", "翠綠山谷", "橙色峽谷", "石板山峰"],
  },
  "zh-CN": {
    hover: "悬停",
    scroll: "滚动",
    loop: "循环",
    entrance: "进场",
    click: "点击",
    replay: "重播",
    close: "关闭",
    caption: "黄昏的港口，下午 6:40",
    alts: ["青绿潟湖", "琥珀沙漠", "蓝色峡湾", "翠绿山谷", "橙色峡谷", "石板山峰"],
  },
  ja: {
    hover: "ホバー",
    scroll: "スクロール",
    loop: "ループ",
    entrance: "登場",
    click: "クリック",
    replay: "再生",
    close: "閉じる",
    caption: "夕暮れの港、午後 6:40",
    alts: ["ティールの潟湖", "琥珀色の砂漠", "青いフィヨルド", "緑の谷", "オレンジの渓谷", "スレートの山並み"],
  },
};

type Kind = "hover" | "scroll" | "loop" | "entrance" | "click";
const kinds: Record<ImageEffectName, Kind> = {
  "ken-burns": "loop",
  "clip-reveal": "entrance",
  "soft-mask": "entrance",
  "hover-zoom": "hover",
  "zoom-lens": "hover",
  "image-swap": "hover",
  glitch: "hover",
  saturate: "hover",
  "parallax-frame": "scroll",
};

function Tile({ name, hint, replay, children }: { name: string; hint: string; replay?: string; children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{hint}</span>
          {replay && (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {replay}
            </button>
          )}
        </div>
      </div>
      <div key={run}>{children}</div>
    </div>
  );
}

export default function ImageEffectsDemo() {
  const t = useDemoText(copy);
  const images: ImageItem[] = t.alts.map((alt, i) => ({ src: demoArt(i), alt }));

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {imageEffects.map((effect, i) => {
        const kind = kinds[effect];
        const image = images[i % images.length];
        return (
          <Tile key={effect} name={effect} hint={t[kind]} replay={kind === "entrance" ? t.replay : undefined}>
            <ImageEffect
              effect={effect}
              src={image.src}
              alt={image.alt}
              images={effect === "image-swap" ? images.slice(0, 3) : undefined}
              caption={effect === "hover-zoom" ? t.caption : undefined}
              direction={effect === "clip-reveal" ? "circle" : undefined}
              trigger="inView"
            />
          </Tile>
        );
      })}
      <Tile name="slice-transition" hint={t.loop}>
        <SliceSlideshow images={images} />
      </Tile>
      <Tile name="lightbox-zoom" hint={t.click}>
        <Lightbox images={images} closeLabel={t.close} />
      </Tile>
    </div>
  );
}
