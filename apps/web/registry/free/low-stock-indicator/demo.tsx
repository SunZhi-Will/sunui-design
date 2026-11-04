"use client";

import { useState } from "react";

import { LowStockIndicator } from "./low-stock-indicator";

export default function LowStockIndicatorDemo() {
  const [stock, setStock] = useState(12);

  return (
    <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex gap-4">
        <div className="size-20 shrink-0 rounded-xl bg-gradient-to-br from-sky-300 to-indigo-400 dark:from-sky-700 dark:to-indigo-800" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">Merino Crew Sweater</p>
          <p className="text-sm text-muted-foreground">Size M, Oatmeal</p>
          <p className="text-sm font-semibold">$89</p>
        </div>
      </div>

      <LowStockIndicator stock={stock} capacity={20} updatedLabel="Live inventory" />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStock((s) => Math.max(0, s - 1))}
          disabled={stock === 0}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Simulate a purchase
        </button>
        <button
          type="button"
          onClick={() => setStock(20)}
          className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
        >
          Restock to 20
        </button>
      </div>
    </div>
  );
}
