"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TextMask, TextOnPath, VariableWeight } from "./type-motion";

// 示範用的海景插畫：SVG data URI，不讀任何外部圖片
const sea = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fbbf24'/><stop offset='.45' stop-color='#f97316'/><stop offset='.55' stop-color='#0e7490'/><stop offset='1' stop-color='#164e63'/></linearGradient></defs><rect width='800' height='400' fill='url(#s)'/><circle cx='520' cy='170' r='70' fill='#fef3c7'/><g fill='none' stroke='#a5f3fc' stroke-width='6' opacity='.6'><path d='M0 250 Q50 235 100 250 T200 250 T300 250 T400 250 T500 250 T600 250 T700 250 T800 250'/><path d='M0 300 Q50 285 100 300 T200 300 T300 300 T400 300 T500 300 T600 300 T700 300 T800 300'/><path d='M0 350 Q50 335 100 350 T200 350 T300 350 T400 350 T500 350 T600 350 T700 350 T800 350'/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

const copy = {
  en: {
    loop: "Loop",
    hover: "Hover",
    replay: "Replay",
    entrance: "Once",
    path: "Free shipping on every order · ",
    ring: "NEW SEASON · NEW SEASON · ",
    arc: "Handmade in small batches",
    weight: "Weight",
    word: "Bold move",
    mask: "OCEAN",
    mask2: "SALE",
  },
  "zh-TW": {
    loop: "循環",
    hover: "滑過",
    replay: "重播",
    entrance: "單次",
    path: "全館滿額免運 · 每天出貨 · ",
    ring: "新品上市 · 新品上市 · ",
    arc: "小批量手工製作",
    weight: "字重變化",
    word: "大膽一點",
    mask: "海洋",
    mask2: "特價",
  },
  "zh-CN": {
    loop: "循环",
    hover: "悬停",
    replay: "重播",
    entrance: "单次",
    path: "全场满额包邮 · 每天发货 · ",
    ring: "新品上市 · 新品上市 · ",
    arc: "小批量手工制作",
    weight: "字重变化",
    word: "大胆一点",
    mask: "海洋",
    mask2: "特价",
  },
  ja: {
    loop: "ループ",
    hover: "ホバー",
    replay: "再生",
    entrance: "1回",
    path: "全品送料無料・毎日発送・",
    ring: "NEW SEASON · NEW SEASON · ",
    arc: "少量ずつ手作りしています",
    weight: "ウェイト",
    word: "大胆に",
    mask: "OCEAN",
    mask2: "SALE",
  },
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
      <div
        key={run}
        className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 px-4 text-foreground"
      >
        {children}
      </div>
    </div>
  );
}

export default function TypeMotionDemo() {
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile name="text-on-path · wave" hint={t.loop}>
        <TextOnPath text={t.path} preset="wave" className="w-full font-semibold" showPath />
      </Tile>
      <Tile name="text-on-path · circle" hint={t.loop}>
        <TextOnPath text={t.ring} preset="circle" className="w-40 font-semibold tracking-widest text-primary" />
      </Tile>
      <Tile name="text-on-path · arc" hint={t.hover}>
        <TextOnPath text={t.arc} preset="arc" trigger="hover" duration={6} className="w-full font-medium" showPath />
      </Tile>
      <Tile name="variable-font · wave" hint={t.loop}>
        <VariableWeight text={t.weight} from={100} to={900} className="text-4xl" />
      </Tile>
      <Tile name="variable-font · word" hint={t.hover}>
        <VariableWeight text={t.word} mode="word" trigger="hover" from={300} to={900} className="text-4xl text-primary" />
      </Tile>
      <Tile name="text-mask · gradient" hint={t.loop}>
        <TextMask text={t.mask2} duration={6} />
      </Tile>
      <Tile name="text-mask · image + reveal" hint={t.entrance} replay={t.replay}>
        <TextMask text={t.mask} src={sea} reveal trigger="inView" duration={5} />
      </Tile>
    </div>
  );
}
