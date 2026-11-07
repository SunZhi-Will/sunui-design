"use client";

import { useDemoText } from "@/lib/demo-locale";

import { PlushPortrait, type PlushFaces } from "./plush-portrait";

const dir = "/blocks/plush-portrait";
const faces: PlushFaces = {
  rest: `${dir}/rest.webp`,
  hover: `${dir}/hover.webp`,
  grab: `${dir}/grab.webp`,
  pull: `${dir}/pull.webp`,
  dazed: `${dir}/dazed.webp`,
  blink: `${dir}/blink.webp`,
  idle: `${dir}/idle.webp`,
  lookLeft: `${dir}/look-left.webp`,
  lookRight: `${dir}/look-right.webp`,
};

const copy = {
  en: { alt: "Portrait of Mei, smiling", poke: "Poke Mei", hint: "Grab her cheek and pull" },
  "zh-TW": { alt: "小梅微笑的肖像", poke: "戳一下小梅", hint: "捏住臉頰往外拉" },
  "zh-CN": { alt: "小梅微笑的肖像", poke: "戳一下小梅", hint: "捏住脸颊往外拉" },
  ja: { alt: "笑顔のメイの肖像", poke: "メイをつつく", hint: "ほっぺをつまんで引っぱって" },
};

/** 型錄卡片：一張圓框肖像，滑過會轉頭看你，抓住臉頰拉開放手會彈回來。 */
export default function PlushPortraitCard() {
  const t = useDemoText(copy);
  return (
    // 拉長的畫布會超出肖像，卡片範圍內裁掉
    <div className="flex h-[260px] w-[300px] flex-col items-center justify-center gap-3 overflow-clip">
      <div className="w-[200px]">
        <PlushPortrait faces={faces} alt={t.alt} pokeLabel={t.poke} frame="circle" />
      </div>
      <p className="text-xs text-muted-foreground">{t.hint}</p>
    </div>
  );
}
