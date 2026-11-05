"use client";

import { useState } from "react";

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

/** 型錄卡片：顏色與尺寸兩組選項，選取外框在選項間滑動，售完的尺寸劃線停用。 */
export default function SegmentedControlCard() {
  const [color, setColor] = useState<Color>("clay");
  const [size, setSize] = useState<Size>("m");
  const left = stock[size];

  return (
    <div className="mx-auto flex w-72 flex-col gap-4">
      <SegmentedControl<Color>
        aria-label="Color"
        size="sm"
        value={color}
        onValueChange={setColor}
        options={colors.map((c) => ({ value: c.value, label: c.label, icon: <Swatch hex={c.hex} /> }))}
      />
      <div className="space-y-2">
        <SegmentedControl<Size>
          aria-label="Size"
          size="sm"
          value={size}
          onValueChange={setSize}
          options={(Object.keys(stock) as Size[]).map((s) => ({
            value: s,
            label: s.toUpperCase(),
            ariaLabel: stock[s] === 0 ? `${s.toUpperCase()}, sold out` : undefined,
            disabled: stock[s] === 0,
          }))}
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          {left <= 3 ? <span className="text-[#c8361d] dark:text-[#ec6a4f]">Only {left} left in this size</span> : "In stock, ships in 1 to 2 days"}
        </p>
      </div>
    </div>
  );
}
