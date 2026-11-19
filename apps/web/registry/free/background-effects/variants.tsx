"use client";

import { useDemoText } from "@/lib/demo-locale";

import { backgroundEffects, EffectBackground, type BackgroundEffect } from "./background-effects";
import { copy, interactive } from "./demo";

export const variants = backgroundEffects;

// The home page shows only this one as a representative; pick one that moves on its own so the card needs no hover to show the effect
export const featured = "aurora";

/** Home catalog: one card per background, inside a fixed-size rounded panel rather than filling the whole screen. */
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
