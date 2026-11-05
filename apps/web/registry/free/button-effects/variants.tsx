"use client";

import { useDemoText } from "@/lib/demo-locale";

import { buttonEffects, EffectButton, type ButtonEffect } from "./button-effects";
import { copy, hints } from "./demo";

export const variants = buttonEffects;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "shine-sweep";

/** 首頁型錄：一種按鈕效果一張卡，下方標出怎麼觸發。 */
export default function ButtonEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const effect = variant as ButtonEffect;
  return (
    <div className="flex flex-col items-center gap-5">
      <EffectButton effect={effect} statusLabels={t.status}>
        {t.labels[effect]}
      </EffectButton>
      <span className="text-xs text-muted-foreground">{t.hints[hints[effect]]}</span>
    </div>
  );
}
