"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ImageEffect, Lightbox, SliceSlideshow, imageEffects, type ImageEffectName, type ImageItem } from "./image-effects";

// 示範照片（AI 生成），放在 public/blocks/image-effects，順序對應 copy.alts
const photos = ["lagoon", "desert", "fjord", "valley", "canyon", "peaks"];

export function demoArt(i: number) {
  return `/blocks/image-effects/${photos[i % photos.length]}.webp`;
}

/** hover-zoom 那格配的照片，和 copy.caption（黃昏的港口）一致 */
export const harborArt = "/blocks/image-effects/harbor.webp";

export const copy = {
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
export const kinds: Record<ImageEffectName, Kind> = {
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
              src={effect === "hover-zoom" ? harborArt : image.src}
              alt={effect === "hover-zoom" ? t.caption : image.alt}
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
