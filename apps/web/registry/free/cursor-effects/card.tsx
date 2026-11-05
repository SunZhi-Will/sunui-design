"use client";

import { useDemoText } from "@/lib/demo-locale";

import { CursorEffect } from "./cursor-effects";

const copy = {
  en: { spotlight: "Follow the light", blend: "Invert" },
  "zh-TW": { spotlight: "跟著光走", blend: "反相" },
  "zh-CN": { spotlight: "跟着光走", blend: "反相" },
  ja: { spotlight: "光を追いかける", blend: "反転" },
};

/** 型錄卡片：三格游標效果，idle 位置讓縮圖不用懸停也看得到 */
export default function CursorEffectsCard() {
  const t = useDemoText(copy);
  const tile = "grid h-24 place-items-center rounded-md border border-border bg-card text-sm font-medium text-foreground";
  return (
    <div className="mx-auto grid w-72 grid-cols-2 gap-3">
      <CursorEffect effect="spotlight" size={120} idle={{ x: 0.35, y: 0.45 }} className={`${tile} col-span-2`}>
        {t.spotlight}
      </CursorEffect>
      <CursorEffect effect="crosshair" idle={{ x: 0.4, y: 0.45 }} className={tile} />
      <CursorEffect effect="blend-circle" size={56} idle={{ x: 0.45, y: 0.5 }} className={`${tile} text-xl font-semibold`}>
        {t.blend}
      </CursorEffect>
    </div>
  );
}
