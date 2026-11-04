"use client";

import { useState } from "react";

import { LogoMarquee, type MarqueeItem } from "./logo-marquee";

// 虛構品牌，僅作展示
const brands: MarqueeItem[] = [
  {
    id: "orbit",
    label: "Orbit",
    content: (
      <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
        </svg>
        Orbit
      </span>
    ),
  },
  {
    id: "fernway",
    label: "Fernway",
    content: (
      <span className="flex items-center gap-2 font-serif text-lg italic">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2c4 4 6 8 6 12a6 6 0 0 1-12 0c0-4 2-8 6-12z" />
        </svg>
        Fernway
      </span>
    ),
  },
  {
    id: "kiln",
    label: "Kiln & Co",
    content: <span className="text-lg font-black tracking-[0.2em] uppercase">Kiln&amp;Co</span>,
  },
  {
    id: "polar",
    label: "Northbeam",
    content: (
      <span className="flex items-center gap-2 text-lg font-medium">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />
        </svg>
        Northbeam
      </span>
    ),
  },
  {
    id: "tandem",
    label: "Tandem",
    content: <span className="font-mono text-lg font-bold">tandem/</span>,
  },
  {
    id: "lumen",
    label: "Lumen Goods",
    content: (
      <span className="flex items-center gap-2 text-lg font-semibold">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <path d="M9 9v6h6" />
        </svg>
        Lumen Goods
      </span>
    ),
  },
];

export default function LogoMarqueeDemo() {
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [speed, setSpeed] = useState(40);

  return (
    <div className="w-full max-w-4xl space-y-6 rounded-2xl border border-border bg-card px-6 py-8 text-card-foreground">
      <p className="text-center text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        Stocked by independent shops worldwide
      </p>
      <LogoMarquee items={brands} direction={direction} speed={speed} />
      <LogoMarquee
        items={[...brands].reverse()}
        direction={direction === "left" ? "right" : "left"}
        speed={speed * 0.7}
        showPauseControl={false}
        labels={{ region: "More partners" }}
        itemClassName="opacity-70"
      />
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setDirection((d) => (d === "left" ? "right" : "left"))}
          className="rounded-full border border-border px-3 py-1.5 text-foreground hover:bg-muted"
        >
          Direction: {direction}
        </button>
        {[20, 40, 80].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            onClick={() => setSpeed(s)}
            className={
              speed === s
                ? "rounded-full bg-primary px-3 py-1.5 text-primary-foreground"
                : "rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
            }
          >
            {s}px/s
          </button>
        ))}
      </div>
    </div>
  );
}
