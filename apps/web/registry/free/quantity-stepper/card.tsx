"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { QuantityStepper } from "./quantity-stepper";

const copy = {
  en: { undo: "Undo remove", sand: "Sand", subtotal: "Subtotal" },
  "zh-TW": { undo: "復原移除", sand: "沙色", subtotal: "小計" },
  "zh-CN": { undo: "撤销移除", sand: "沙色", subtotal: "小计" },
  ja: { undo: "削除を取り消す", sand: "サンド", subtotal: "小計" },
};

/** 型錄卡片：一列購物車品項，加減或長按步進器，數字滾動、小計跟著變。 */
export default function QuantityStepperCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const name = useProductNames().mug;
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n);
  const [qty, setQty] = useState(2);
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return (
      <button type="button" onClick={() => setRemoved(false)} className="mx-auto block text-sm text-muted-foreground underline underline-offset-4">
        {t.undo}
      </button>
    );
  }

  return (
    <div className="mx-auto w-72 rounded-md border border-border bg-card text-card-foreground">
      <div className="flex items-center gap-3 p-3">
        <ProductArt kind="mug" className="size-12 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {t.sand}, {money(22)}
          </p>
        </div>
        <QuantityStepper size="sm" locale={locale} value={qty} max={10} removable onRemove={() => setRemoved(true)} onValueChange={setQty} />
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm">
        <span className="text-muted-foreground">{t.subtotal}</span>
        <span className="font-semibold tracking-tight tabular-nums">{money(22 * qty)}</span>
      </div>
    </div>
  );
}
