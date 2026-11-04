"use client";

import { useState } from "react";

import { MagneticButton } from "./magnetic-button";

export default function MagneticButtonDemo() {
  const [strength, setStrength] = useState(0.35);
  const [clicks, setClicks] = useState(0);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-10 rounded-2xl border border-border bg-card px-6 py-14 text-card-foreground">
      <div className="text-center">
        <p className="text-2xl font-semibold tracking-tight">Spring Collection</p>
        <p className="mt-1 text-sm text-muted-foreground">Move your pointer near the buttons.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-10">
        <MagneticButton size="lg" strength={strength} onClick={() => setClicks((c) => c + 1)}>
          Shop the drop
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </MagneticButton>
        <MagneticButton variant="outline" strength={strength} radius={60}>
          View lookbook
        </MagneticButton>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2 text-xs text-muted-foreground">
        <label htmlFor="magnet-strength" className="flex justify-between">
          <span>Strength</span>
          <span className="tabular-nums">{strength.toFixed(2)}</span>
        </label>
        <input
          id="magnet-strength"
          type="range"
          min={0}
          max={0.8}
          step={0.05}
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
          className="accent-primary"
        />
        <p aria-live="polite">{clicks > 0 ? `Clicked ${clicks} time${clicks === 1 ? "" : "s"}` : " "}</p>
      </div>
    </div>
  );
}
