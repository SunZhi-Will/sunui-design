"use client";

import { useState } from "react";

import { AnimatedNumber } from "./animated-number";

const currencies = [
  { code: "USD", locale: "en-US" },
  { code: "EUR", locale: "de-DE" },
  { code: "JPY", locale: "ja-JP" },
];

export default function AnimatedNumberDemo() {
  const [qty, setQty] = useState(1);
  const [cur, setCur] = useState(0);
  const unit = 49.9;
  const subtotal = Math.round(unit * qty * 100) / 100;
  const { code, locale } = currencies[cur];

  return (
    <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order total</p>
          <AnimatedNumber
            value={code === "JPY" ? Math.round(subtotal * 150) : subtotal}
            currency={code}
            locale={locale}
            upIsGood={false}
            announce
            className="text-4xl font-semibold tracking-tight"
          />
        </div>
        <div className="flex rounded-full border border-border p-0.5 text-xs" role="group" aria-label="Currency">
          {currencies.map((c, i) => (
            <button
              key={c.code}
              type="button"
              aria-pressed={i === cur}
              onClick={() => setCur(i)}
              className={
                i === cur
                  ? "rounded-full bg-primary px-2.5 py-1 text-primary-foreground"
                  : "rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
        <span className="text-sm">Trail Runner x {qty}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-8 place-items-center rounded-full border border-border bg-background text-foreground hover:bg-card"
          >
            -
          </button>
          <AnimatedNumber value={qty} className="w-6 justify-center text-sm font-medium" trendColors={false} />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="grid size-8 place-items-center rounded-full border border-border bg-background text-foreground hover:bg-card"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setQty((q) => q + 7)}
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Bulk add 7 (watch the odometer)
      </button>
    </div>
  );
}
