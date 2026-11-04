"use client";

import { useState } from "react";

import { SelectionBounds, type BoundsItem } from "./selection-bounds";

export default function SelectionBoundsDemo() {
  const [photo, setPhoto] = useState<BoundsItem>({ id: "photo", x: 96, y: 60, width: 160, height: 140, rotation: -4 });
  const [selected, setSelected] = useState(true);

  return (
    <div
      onPointerDown={(e) => e.target === e.currentTarget && setSelected(false)}
      className="relative h-[320px] w-full max-w-xl min-w-0 touch-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 select-none"
      style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      <div
        onPointerDown={() => setSelected(true)}
        className="absolute"
        style={{ left: photo.x, top: photo.y, width: photo.width, height: photo.height, transform: `rotate(${photo.rotation ?? 0}deg)` }}
      >
        <div className="h-full w-full overflow-hidden rounded-lg bg-gradient-to-br from-sky-300 via-indigo-300 to-rose-300 shadow-lg">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
            <circle cx="72" cy="28" r="10" fill="#fff" opacity="0.8" />
            <path d="M0 80 L30 50 L55 72 L75 58 L100 80 L100 100 L0 100 Z" fill="#fff" opacity="0.55" />
          </svg>
        </div>
      </div>
      <SelectionBounds items={selected ? [photo] : []} onChange={([next]) => next && setPhoto(next)} rotatable />
    </div>
  );
}
