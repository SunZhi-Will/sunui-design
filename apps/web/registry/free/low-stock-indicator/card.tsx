"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { LowStockIndicator } from "./low-stock-indicator";

const copy = {
  en: { variant: "Steel, 20 mm strap", updated: "Updated just now", buy: "Buy one", restock: "Restock" },
  "zh-TW": { variant: "不鏽鋼，20 mm 錶帶", updated: "剛剛更新", buy: "買一件", restock: "補貨" },
  "zh-CN": { variant: "不锈钢，20 mm 表带", updated: "刚刚更新", buy: "买一件", restock: "补货" },
  ja: { variant: "ステンレス、20 mm ベルト", updated: "たった今更新", buy: "1 点購入", restock: "再入荷" },
};

/** 型錄卡片：一件商品的庫存條，按 Buy one 一路從充足掉到告急，再蓋上售完章。 */
export default function LowStockIndicatorCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const name = useProductNames().watch;
  const [stock, setStock] = useState(9);

  return (
    <div className="mx-auto w-64 space-y-3">
      <div className="flex items-center gap-3">
        <ProductArt kind="watch" className="size-14 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-sm tabular-nums">$210</p>
          </div>
          <p className="text-xs text-muted-foreground">{t.variant}</p>
        </div>
      </div>
      <LowStockIndicator locale={locale} stock={stock} capacity={12} updatedLabel={t.updated} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStock((s) => Math.max(0, s - 1))}
          disabled={stock === 0}
          className="h-9 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {t.buy}
        </button>
        <button type="button" onClick={() => setStock(9)} className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
          {t.restock}
        </button>
      </div>
    </div>
  );
}
