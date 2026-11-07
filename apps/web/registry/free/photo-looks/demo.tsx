"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { PhotoLook, photoLooks, type PhotoLookName } from "./photo-looks";

// 示範照片（AI 生成），放在 public/blocks/photo-looks：
// 風景是正午山丘、路燈、紅車與遠處一人；人像是淺色牆前的側臉半身，給 double-exposure 用
const SCENE = "/blocks/photo-looks/scene.webp";
const PORTRAIT = "/blocks/photo-looks/portrait.webp";

const copy = {
  en: {
    hint: "Hover shows original",
    replay: "Replay",
    alt: "Hills at noon with a person, two street lamps and a red car",
    portrait: "Side profile of a person in a dark sweater against a light wall",
  },
  "zh-TW": {
    hint: "滑過看原圖",
    replay: "重播",
    alt: "正午的山丘，一個人、兩盞路燈與一台紅色的車",
    portrait: "淺色牆前穿深色毛衣的側臉人像",
  },
  "zh-CN": {
    hint: "悬停查看原图",
    replay: "重播",
    alt: "正午的山丘，一个人、两盏路灯与一辆红色的车",
    portrait: "浅色墙前穿深色毛衣的侧脸人像",
  },
  ja: {
    hint: "ホバーで元画像",
    replay: "再生",
    alt: "昼の丘と人物、二本の街灯、赤い車",
    portrait: "明るい壁の前に立つ、濃い色のセーターを着た人物の横顔",
  },
};

function Tile({ name, hint, replay, children }: { name: string; hint: string; replay: string; children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{hint}</span>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {replay}
          </button>
        </div>
      </div>
      <div key={run}>{children}</div>
    </div>
  );
}

/** 單一攝影風格的示範格：完整 demo 與首頁型錄（variants.tsx）共用 */
export function PhotoLookTile({ effect }: { effect: PhotoLookName }) {
  const t = useDemoText(copy);
  const portrait = effect === "double-exposure";
  return (
    <Tile name={effect} hint={t.hint} replay={t.replay}>
      <PhotoLook
        effect={effect}
        src={portrait ? PORTRAIT : SCENE}
        alt={portrait ? t.portrait : t.alt}
        secondSrc={portrait ? SCENE : undefined}
        trigger="hover"
        invert
      />
    </Tile>
  );
}

export default function PhotoLooksDemo() {
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {photoLooks.map((effect: PhotoLookName) => (
        <PhotoLookTile key={effect} effect={effect} />
      ))}
    </div>
  );
}
