"use client";

import { useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { SelectionBounds, type BoundsItem } from "./selection-bounds";

export default function SelectionBoundsDemo() {
  const locale = useDemoLocale();
  const [photo, setPhoto] = useState<BoundsItem>({ id: "photo", x: 96, y: 60, width: 160, height: 140, rotation: -4 });
  const [selected, setSelected] = useState(true);

  return (
    <div
      onPointerDown={(e) => e.target === e.currentTarget && setSelected(false)}
      className="relative h-[320px] w-full max-w-xl min-w-0 touch-none overflow-hidden rounded-xl border border-border bg-background select-none"
      style={{ backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--muted-foreground) 30%, transparent) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      <div
        onPointerDown={() => setSelected(true)}
        className="absolute"
        style={{ left: photo.x, top: photo.y, width: photo.width, height: photo.height, transform: `rotate(${photo.rotation ?? 0}deg)` }}
      >
        <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
          <svg viewBox="0 0 100 100" className="h-full w-full text-foreground" preserveAspectRatio="none" aria-hidden>
            <circle cx="72" cy="28" r="9" fill="currentColor" opacity="0.18" />
            <path d="M0 80 L30 50 L55 72 L75 58 L100 80 L100 100 L0 100 Z" fill="currentColor" opacity="0.14" />
          </svg>
        </div>
      </div>
      <SelectionBounds items={selected ? [photo] : []} onChange={([next]) => next && setPhoto(next)} rotatable locale={locale} />
    </div>
  );
}
