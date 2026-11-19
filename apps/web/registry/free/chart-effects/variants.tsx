"use client";

import { chartEffects } from "./chart-effects";
import { DemoChart } from "./demo";

export const variants = chartEffects;

// The home page shows only this one as the representative, picking one that moves on its own so the card shows the effect without hovering first
export const featured = "bar-race";

/** Home catalog: one card per chart effect, replaying periodically on screen with loop. */
export default function ChartEffectsVariant({ variant }: { variant: string }) {
  return (
    <div className="w-72 text-card-foreground">
      <DemoChart variant={variant as (typeof chartEffects)[number]} trigger="loop" />
    </div>
  );
}
