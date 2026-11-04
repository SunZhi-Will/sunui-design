"use client";

import { useState } from "react";

import { GradientBackground, gradientPresets, type GradientPreset } from "./gradient-background";

const presets = Object.keys(gradientPresets) as GradientPreset[];
const patterns = ["grid", "dots", "none"] as const;

export default function GradientBackgroundDemo() {
  const [preset, setPreset] = useState<GradientPreset>("aurora");
  const [pattern, setPattern] = useState<(typeof patterns)[number]>("grid");
  const [paused, setPaused] = useState(false);

  return (
    <div className="w-full max-w-3xl space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Palette" className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={preset === p}
              onClick={() => setPreset(p)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ background: `linear-gradient(135deg, ${gradientPresets[p][0]}, ${gradientPresets[p][2]})` }}
              />
              {p}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Pattern" className="flex gap-1">
          {patterns.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={pattern === p}
              onClick={() => setPattern(p)}
              className="rounded-full border border-border px-3 py-1.5 capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {p}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((v) => !v)}
          className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <GradientBackground
        colors={preset}
        pattern={pattern}
        paused={paused}
        className="rounded-3xl border border-border"
        contentClassName="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      >
        <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
          Now in public beta
        </span>
        <h3 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">Ship calmer interfaces</h3>
        <p className="max-w-sm text-muted-foreground">A soft ambient backdrop for heroes, empty states and sign-in screens.</p>
        <button type="button" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm">
          Get started
        </button>
      </GradientBackground>
    </div>
  );
}
