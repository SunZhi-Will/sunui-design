"use client";

import { useState } from "react";

import { ProductArt } from "@/registry/_demo/product-art";

import { LowStockIndicator } from "./low-stock-indicator";

/** 型錄卡片：一件商品的庫存條，按 Buy one 一路從充足掉到告急，再蓋上售完章。 */
export default function LowStockIndicatorCard() {
  const [stock, setStock] = useState(9);

  return (
    <div className="mx-auto w-64 space-y-3">
      <div className="flex items-center gap-3">
        <ProductArt kind="watch" className="size-14 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium">Field Watch</p>
            <p className="text-sm tabular-nums">$210</p>
          </div>
          <p className="text-xs text-muted-foreground">Steel, 20 mm strap</p>
        </div>
      </div>
      <LowStockIndicator stock={stock} capacity={12} updatedLabel="Updated just now" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStock((s) => Math.max(0, s - 1))}
          disabled={stock === 0}
          className="h-9 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Buy one
        </button>
        <button type="button" onClick={() => setStock(9)} className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
          Restock
        </button>
      </div>
    </div>
  );
}
