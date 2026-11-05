"use client";

import { EffectBackground, type BackgroundEffect } from "./background-effects";

const picks: BackgroundEffect[] = ["aurora", "retro-grid", "meteors", "particles"];

/** 型錄卡片：四格縮圖展示極光、復古網格、流星與粒子 */
export default function BackgroundEffectsCard() {
  return (
    <div className="mx-auto grid w-72 grid-cols-2 gap-2">
      {picks.map((effect) => (
        <div key={effect} className="relative h-24 overflow-hidden rounded-md border border-border bg-card">
          <EffectBackground effect={effect} />
        </div>
      ))}
    </div>
  );
}
