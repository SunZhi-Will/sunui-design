"use client";

import { GradientPresetTile } from "./demo";
import { gradientPresets, type GradientPreset } from "./gradient-backdrop";

export const variants = gradientPresets;

// Only this one is shown on the home page as the representative: its colour flow is the most visible
export const featured = "aurora";

/** Home catalog: one card per gradient background. */
export default function GradientBackdropVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <GradientPresetTile preset={variant as GradientPreset} />
    </div>
  );
}
