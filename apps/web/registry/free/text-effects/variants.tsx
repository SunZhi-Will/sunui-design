"use client";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { TextEffect, textEffects, type TextEffectName } from "./text-effects";
import { copy, sampleFor } from "./demo";

export const variants = textEffects;

// The home page shows only this one as the representative; pick one that moves by itself, so a card needs no hover to show the effect
export const featured = "gradient-flow";

/** Home catalog: one card per text effect. Uses the loop trigger, so entrance effects replay periodically while in view */
export default function TextEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const effect = variant as TextEffectName;
  return (
    <div className="grid min-h-32 w-72 place-items-center overflow-hidden text-center">
      <TextEffect
        effect={effect}
        text={sampleFor(effect, t)}
        words={t.words}
        trigger="loop"
        className={cn(
          "font-semibold tracking-tight",
          effect === "circle-text" ? "text-base" : effect === "kinetic-stack" ? "text-3xl uppercase" : "text-3xl",
        )}
      />
    </div>
  );
}
