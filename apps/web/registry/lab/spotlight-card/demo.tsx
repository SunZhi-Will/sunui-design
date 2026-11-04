"use client";

import { useState } from "react";

import { SpotlightCard, type SpotlightCardProps } from "./spotlight-card";

type Variant = NonNullable<SpotlightCardProps["variant"]>;

const features = [
  { title: "Edge caching", body: "Static assets are served from the closest region in under 40 ms.", color: "#8b5cf6", d: "M4 12h16M12 4v16M6 6l12 12" },
  { title: "Instant rollbacks", body: "Every deploy is immutable, so reverting takes a single click.", color: "#10b981", d: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4" },
  { title: "Usage alerts", body: "Get notified before a spike turns into a surprise invoice.", color: "#f59e0b", d: "M12 4a5 5 0 0 0-5 5v4l-2 3h14l-2-3V9a5 5 0 0 0-5-5zM10 19a2 2 0 0 0 4 0" },
];

export default function SpotlightCardDemo() {
  const [variant, setVariant] = useState<Variant>("solid");
  const [tilt, setTilt] = useState(true);

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Variant" className="flex gap-1">
          {(["solid", "glass", "outline"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={variant === v}
              onClick={() => setVariant(v)}
              className="rounded-full border border-border px-3 py-1.5 capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {v}
            </button>
          ))}
        </div>
        <label className="ml-2 flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={tilt} onChange={(e) => setTilt(e.target.checked)} className="size-4 accent-current" />
          Tilt
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <SpotlightCard key={f.title} variant={variant} tilt={tilt} glowColor={f.color}>
            <span
              className="mb-4 flex size-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in oklab, ${f.color} 16%, transparent)`, color: f.color }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.d} />
              </svg>
            </span>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            <a href="#" onClick={(e) => e.preventDefault()} className="mt-4 inline-block rounded text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              Learn more
            </a>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
