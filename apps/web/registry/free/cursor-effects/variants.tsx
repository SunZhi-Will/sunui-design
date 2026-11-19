"use client";

import { useDemoText } from "@/lib/demo-locale";

import { cursorEffects, type CursorEffectName } from "./cursor-effects";
import { copy, CursorEffectArea } from "./demo";

export const variants = cursorEffects;

// The home page shows only this one as a representative; pick one that moves on its own so the card needs no hover to show the effect
export const featured = "spotlight";

/** Home catalog: one card per cursor effect; the interaction area is shared with the demo page */
export default function CursorEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const effect = variant as CursorEffectName;
  return (
    <div className="flex w-72 flex-col items-center gap-3">
      <div className="w-full">
        <CursorEffectArea effect={effect} />
      </div>
      {effect === "image-hover" && <span className="text-xs text-muted-foreground">{t.move}</span>}
      <span className="text-xs text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hidden">{t.needsMouse}</span>
    </div>
  );
}
