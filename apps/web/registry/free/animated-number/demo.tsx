"use client";

import { useState } from "react";

import { ProductArt, productNames } from "@/registry/_demo/product-art";

import { AnimatedNumber } from "./animated-number";

const finishes = [
  { id: "black", label: "Matte black", extra: 0 },
  { id: "walnut", label: "Walnut cups", extra: 40 },
];

export default function AnimatedNumberDemo() {
  const [finish, setFinish] = useState(finishes[0]);
  const [qty, setQty] = useState(1);
  const [withCase, setWithCase] = useState(false);
  const total = (189 + finish.extra + (withCase ? 29 : 0)) * qty;

  return (
    <div className="grid w-full max-w-2xl gap-6 rounded-md border border-border bg-card p-4 text-card-foreground sm:grid-cols-[14rem_1fr] sm:p-5">
      <ProductArt kind="headphones" className="aspect-[3/2] rounded-md sm:aspect-square" />

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{productNames.headphones}</h2>
          <p className="text-sm text-muted-foreground">Closed back, 40 h battery, folds flat.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Finish</legend>
          {finishes.map((f) => (
            <label key={f.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="finish"
                checked={finish.id === f.id}
                onChange={() => setFinish(f)}
                className="size-4 accent-foreground"
              />
              {f.label}
              {f.extra > 0 && <span className="text-muted-foreground tabular-nums">+${f.extra}</span>}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm">
            <input type="checkbox" checked={withCase} onChange={(e) => setWithCase(e.target.checked)} className="size-4 accent-foreground" />
            Add travel case <span className="text-muted-foreground tabular-nums">+$29</span>
          </label>
        </fieldset>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <AnimatedNumber value={total} currency="USD" trendArrow announce className="text-3xl font-semibold tracking-tight" />
          </div>
          <div className="flex h-9 items-center rounded-md border border-border text-sm">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 8h10" strokeLinecap="round" />
              </svg>
            </button>
            <AnimatedNumber value={qty} className="w-6 justify-center font-medium" />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(9, q + 1))}
              className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
