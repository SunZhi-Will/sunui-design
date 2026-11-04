"use client";

import { useState, type ReactNode } from "react";

import {
  BouncingDots,
  EqualizerBars,
  InfinityLoader,
  OrbitLoader,
  PulseRings,
  RingSpinner,
  SpinnerToCheck,
  type LoaderProps,
} from "./loader-set";

const loaders: { name: string; Comp: (p: LoaderProps) => ReactNode }[] = [
  { name: "OrbitLoader", Comp: OrbitLoader },
  { name: "BouncingDots", Comp: BouncingDots },
  { name: "EqualizerBars", Comp: EqualizerBars },
  { name: "RingSpinner", Comp: RingSpinner },
  { name: "PulseRings", Comp: PulseRings },
  { name: "InfinityLoader", Comp: InfinityLoader },
];

const sizes = [20, 32, 48];

export default function LoaderSetDemo() {
  const [size, setSize] = useState(32);
  const [done, setDone] = useState(false);

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div role="radiogroup" aria-label="Loader size" className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Size</span>
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={size === s}
            onClick={() => setSize(s)}
            className={
              size === s
                ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground hover:bg-muted"
            }
          >
            {s}px
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loaders.map(({ name, Comp }) => (
          <li key={name} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex h-14 items-center text-primary">
              <Comp size={size} />
            </div>
            <span className="font-mono text-xs text-muted-foreground">{name}</span>
          </li>
        ))}
        <li className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5">
          <div className={done ? "flex h-14 items-center text-emerald-500" : "flex h-14 items-center text-primary"}>
            <SpinnerToCheck size={size} done={done} label="Saving" doneLabel="Saved" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">SpinnerToCheck</span>
          <button
            type="button"
            onClick={() => setDone((d) => !d)}
            className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            {done ? "Reset" : "Finish"}
          </button>
        </li>
      </ul>
    </div>
  );
}
