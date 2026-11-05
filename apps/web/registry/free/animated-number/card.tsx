"use client";

import { useState } from "react";

import { AnimatedNumber } from "./animated-number";

/** 型錄卡片：調整數量，總額的每一位數像機械計數器一樣滾動。 */
export default function AnimatedNumberCard() {
  const [qty, setQty] = useState(1);
  const total = 189 * qty;

  return (
    <div className="mx-auto flex w-64 flex-col gap-4 rounded-md border border-border bg-card p-4 text-card-foreground">
      <div>
        <p className="text-xs text-muted-foreground">Total</p>
        <AnimatedNumber value={total} currency="USD" trendArrow announce className="text-3xl font-semibold tracking-tight" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm">Quantity</span>
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
  );
}
