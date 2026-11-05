"use client";

import { useDemoText } from "@/lib/demo-locale";

import { backgroundEffects, EffectBackground, type BackgroundEffect } from "./background-effects";
import { copy, interactive } from "./demo";

export const variants = backgroundEffects;

/** 首頁型錄：一種背景一張卡，放在固定大小的圓角面板裡，不鋪滿整個畫面。 */
export default function BackgroundEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const effect = variant as BackgroundEffect;
  return (
    <div className="relative h-[220px] w-[320px] overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <EffectBackground effect={effect}>
        <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
          <p className="text-base font-semibold tracking-tight">{t.names[effect]}</p>
          {interactive.includes(effect) && <p className="mt-1 text-xs text-muted-foreground">{t.pointer}</p>}
        </div>
      </EffectBackground>
    </div>
  );
}
