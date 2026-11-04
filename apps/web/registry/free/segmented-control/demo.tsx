"use client";

import { useState } from "react";

import { ProductArt, productNames } from "@/registry/_demo/product-art";

import { SegmentedControl } from "./segmented-control";

type Color = "oat" | "clay" | "ink";
type Size = "xs" | "s" | "m" | "l" | "xl";

const colors: { value: Color; label: string; hex: string }[] = [
  { value: "oat", label: "Oat", hex: "#d8ccb2" },
  { value: "clay", label: "Clay", hex: "#a5634a" },
  { value: "ink", label: "Ink", hex: "#2b2926" },
];

const stock: Record<Size, number> = { xs: 6, s: 14, m: 2, l: 9, xl: 0 };

function Swatch({ hex }: { hex: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill={hex} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}

export default function SegmentedControlDemo() {
  const [color, setColor] = useState<Color>("clay");
  const [size, setSize] = useState<Size>("m");
  const colorName = colors.find((c) => c.value === color)?.label;
  const left = stock[size];

  return (
    <div className="grid w-full max-w-2xl gap-6 rounded-md border border-border bg-card p-4 text-card-foreground sm:grid-cols-[15rem_1fr] sm:p-5">
      <ProductArt kind="jacket" tone="kraft" className="aspect-[3/2] rounded-md sm:aspect-square" />

      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{productNames.jacket}</h2>
          <p className="mt-0.5 text-lg tabular-nums">$128.00</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">
            Color <span className="text-muted-foreground">{colorName}</span>
          </p>
          <SegmentedControl<Color>
            aria-label="Color"
            value={color}
            onValueChange={setColor}
            options={colors.map((c) => ({ value: c.value, label: c.label, icon: <Swatch hex={c.hex} /> }))}
          />
        </div>

        <div className="space-y-2">
          <p className="flex items-baseline justify-between gap-3 text-sm">
            Size
            <span className="text-xs text-muted-foreground underline underline-offset-4">Size guide</span>
          </p>
          <SegmentedControl<Size>
            aria-label="Size"
            value={size}
            onValueChange={setSize}
            options={(Object.keys(stock) as Size[]).map((s) => ({
              value: s,
              label: s.toUpperCase(),
              ariaLabel: stock[s] === 0 ? `${s.toUpperCase()}, sold out` : undefined,
              disabled: stock[s] === 0,
            }))}
          />
          <p className="text-xs text-muted-foreground">
            {left <= 3 ? <span className="text-[#c8361d] dark:text-[#ec6a4f]">Only {left} left in this size</span> : "In stock, ships in 1 to 2 days"}
          </p>
        </div>

        <button
          type="button"
          className="mt-auto h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Add to bag
        </button>
      </div>
    </div>
  );
}
