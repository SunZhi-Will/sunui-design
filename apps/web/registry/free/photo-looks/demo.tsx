"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { PhotoLook, photoLooks, type PhotoLookName } from "./photo-looks";

// 示範用的佔位插畫：SVG data URI，不讀任何外部圖片。
// 風景：天空、太陽、山丘、人物剪影、兩盞路燈、馬路與一台車
function sceneArt() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7DB6E3'/><stop offset='1' stop-color='#E7F2F8'/></linearGradient><radialGradient id='g'><stop offset='0' stop-color='#FFF6D5'/><stop offset='1' stop-color='#FFF6D5' stop-opacity='0'/></radialGradient></defs><rect width='800' height='600' fill='url(#s)'/><circle cx='560' cy='170' r='120' fill='url(#g)' opacity='.8'/><circle cx='560' cy='170' r='46' fill='#FFF4C9'/><path d='M0 360 L140 270 L300 340 L470 250 L640 330 L800 280 V600 H0Z' fill='#8FBF8C'/><path d='M0 420 L200 350 L420 410 L620 360 L800 400 V600 H0Z' fill='#4F8E5B'/><rect y='470' width='800' height='130' fill='#C7B28A'/><rect y='505' width='800' height='70' fill='#4B4C57'/><g fill='#F3EFE4'><rect x='40' y='536' width='60' height='6'/><rect x='200' y='536' width='60' height='6'/><rect x='360' y='536' width='60' height='6'/><rect x='520' y='536' width='60' height='6'/><rect x='680' y='536' width='60' height='6'/></g><g><rect x='470' y='512' width='120' height='34' rx='10' fill='#D2463F'/><path d='M492 512 L512 488 H558 L578 512Z' fill='#D2463F'/><path d='M500 510 L515 492 H552 L568 510Z' fill='#CFE6F2'/><circle cx='498' cy='548' r='11' fill='#22232B'/><circle cx='562' cy='548' r='11' fill='#22232B'/></g><g fill='#2B3243'><circle cx='330' cy='330' r='26'/><path d='M292 470 C292 392 302 366 330 366 C358 366 368 392 368 470Z'/></g><g fill='#3A3B46'><rect x='130' y='330' width='8' height='175'/><rect x='130' y='330' width='40' height='6'/><rect x='660' y='330' width='8' height='175'/><rect x='628' y='330' width='40' height='6'/></g><g fill='#FFF8DA'><circle cx='170' cy='344' r='10'/><circle cx='628' cy='344' r='10'/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// 人像：淺色背景上的半身剪影，給 double-exposure 用
function portraitArt() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'><rect width='800' height='600' fill='#F4F1EC'/><g fill='#2A2E3A'><ellipse cx='400' cy='230' rx='92' ry='112'/><rect x='360' y='320' width='80' height='60'/><path d='M190 600 C200 450 280 380 400 380 C520 380 600 450 610 600Z'/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const SCENE = sceneArt();
const PORTRAIT = portraitArt();

const copy = {
  en: {
    hint: "Hover shows original",
    replay: "Replay",
    alt: "Hills at noon with a person, two street lamps and a red car",
    portrait: "Portrait silhouette on a light background",
  },
  "zh-TW": {
    hint: "滑過看原圖",
    replay: "重播",
    alt: "正午的山丘，一個人、兩盞路燈與一台紅色的車",
    portrait: "淺色背景上的人像剪影",
  },
  "zh-CN": {
    hint: "悬停查看原图",
    replay: "重播",
    alt: "正午的山丘，一个人、两盏路灯与一辆红色的车",
    portrait: "浅色背景上的人像剪影",
  },
  ja: {
    hint: "ホバーで元画像",
    replay: "再生",
    alt: "昼の丘と人物、二本の街灯、赤い車",
    portrait: "明るい背景の人物シルエット",
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
