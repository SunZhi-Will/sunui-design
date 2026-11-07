"use client";

import { GradientPresetTile } from "./demo";
import { gradientPresets, type GradientPreset } from "./gradient-backdrop";

export const variants = gradientPresets;

// 首頁預設只放這一種當代表：顏色流動最明顯
export const featured = "aurora";

/** 首頁型錄：一種漸層背景一張卡。 */
export default function GradientBackdropVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <GradientPresetTile preset={variant as GradientPreset} />
    </div>
  );
}
