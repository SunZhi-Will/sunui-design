"use client";

import { useDemoText } from "@/lib/demo-locale";

import { buttonEffects, EffectButton, type ButtonEffect } from "./button-effects";
import { copy, hints } from "./demo";

export const variants = buttonEffects;

// The home page shows only this one as the representative; pick one that moves by itself, so a card needs no hover to show the effect
export const featured = "shine-sweep";

/** Home catalog: one card per button effect, with how it is triggered noted below. */
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
