"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AnimatedNumber } from "./animated-number";

const copy = {
  en: { total: "Total", quantity: "Quantity", dec: "Decrease quantity", inc: "Increase quantity" },
  "zh-TW": { total: "總計", quantity: "數量", dec: "減少數量", inc: "增加數量" },
  "zh-CN": { total: "合计", quantity: "数量", dec: "减少数量", inc: "增加数量" },
  ja: { total: "合計", quantity: "数量", dec: "数量を減らす", inc: "数量を増やす" },
};

/** 型錄卡片：調整數量，總額的每一位數像機械計數器一樣滾動。 */
export default function AnimatedNumberCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [qty, setQty] = useState(1);
  const total = 189 * qty;

  return (
    <div className="mx-auto flex w-64 flex-col gap-4 rounded-md border border-border bg-card p-4 text-card-foreground">
      <div>
        <p className="text-xs text-muted-foreground">{t.total}</p>
        <AnimatedNumber locale={locale} value={total} currency="USD" trendArrow announce className="text-3xl font-semibold tracking-tight" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm">{t.quantity}</span>
        <div className="flex h-9 items-center rounded-md border border-border text-sm">
          <button
            type="button"
            aria-label={t.dec}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 8h10" strokeLinecap="round" />
            </svg>
          </button>
          <AnimatedNumber locale={locale} value={qty} className="w-6 justify-center font-medium" />
          <button
            type="button"
            aria-label={t.inc}
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
