"use client";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { TextEffect, textEffects, type TextEffectName } from "./text-effects";
import { copy, sampleFor } from "./demo";

export const variants = textEffects;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "gradient-flow";

/** 首頁型錄：一種文字效果一張卡。用 loop 觸發，進場類效果會在畫面內定期重播 */
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
