"use client";

import { EffectBackground, type BackgroundEffect } from "./background-effects";

const picks: BackgroundEffect[] = ["aurora", "retro-grid", "meteors", "particles"];

/** Catalog card: four thumbnails showing aurora, retro grid, meteors and particles */
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
