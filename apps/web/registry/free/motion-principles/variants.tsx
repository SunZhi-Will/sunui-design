"use client";

import { MotionPrincipleTile } from "./demo";
import { motionPrinciples, type MotionPrincipleName } from "./motion-principles";

export const variants = motionPrinciples;

// The home page shows only this one as the representative, picking a continuous loop so the card is visible without a replay
export const featured = "squash-stretch";

/** Home catalog: one card per motion principle. */
export default function MotionPrinciplesVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <MotionPrincipleTile effect={variant as MotionPrincipleName} />
    </div>
  );
}
