"use client";

import { useState } from "react";

import { BorderBeam, type BorderBeamVariant } from "./border-beam";

const variants: BorderBeamVariant[] = ["beam", "rotating", "marching-ants", "neon"];

export default function BorderBeamDemo() {
  const [variant, setVariant] = useState<BorderBeamVariant>("beam");
  const colors = variant === "neon" ? ["#22d3ee"] : ["#8b5cf6", "#ec4899", "#f59e0b"];

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div role="radiogroup" aria-label="Border variant" className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={variant === v}
            onClick={() => setVariant(v)}
            className={
              variant === v
                ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground hover:bg-muted"
            }
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-start">
        <BorderBeam variant={variant} colors={colors} radius={20}>
          <div className="rounded-[inherit] bg-card p-6 text-card-foreground">
            <p className="text-sm font-medium text-muted-foreground">Pro</p>
            <p className="mt-2 text-3xl font-semibold">
              $24<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>Unlimited projects</li>
              <li>Priority support</li>
              <li>Custom domains</li>
            </ul>
            <button type="button" className="mt-6 w-full rounded-full bg-primary py-2 text-sm font-medium text-primary-foreground">
              Upgrade
            </button>
          </div>
        </BorderBeam>

        <div className="space-y-6">
          <BorderBeam variant={variant} colors={colors} radius={12} borderWidth={1.5} duration={3}>
            <label className="block rounded-[inherit] bg-background">
              <span className="sr-only">Ask anything</span>
              <input
                type="text"
                placeholder="Ask anything..."
                className="w-full rounded-[inherit] bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </BorderBeam>

          <BorderBeam variant={variant} colors={colors} radius={999} duration={2.5} className="inline-block">
            <button
              type="button"
              className="rounded-[inherit] bg-card px-6 py-2.5 text-sm font-medium text-card-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Generate
            </button>
          </BorderBeam>
        </div>
      </div>
    </div>
  );
}
