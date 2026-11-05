"use client";

import { useDemoText } from "@/lib/demo-locale";

import { cursorEffects, type CursorEffectName } from "./cursor-effects";
import { copy, CursorEffectArea } from "./demo";

export const variants = cursorEffects;

/** 首頁型錄：一種游標效果一張卡，互動區和示範頁共用 */
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
