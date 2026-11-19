"use client";

import { AnimatedBeam, BlobMorph, LiquidFill, RadarSweep } from "./svg-effects";

/** Catalog card: animated beam, organic morph, radar sweep and liquid fill */
export default function SvgEffectsCard() {
  return (
    <div className="mx-auto grid w-72 grid-cols-3 items-center gap-3 rounded-md border border-border bg-card p-4">
      <AnimatedBeam className="col-span-3" inputs={3} outputs={1} />
      <BlobMorph />
      <RadarSweep />
      <LiquidFill value={64} label="64%" />
    </div>
  );
}
