"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { LowStockIndicator } from "./low-stock-indicator";

const items: { kind: ProductKind; price: number; stock: number; capacity?: number }[] = [
  { kind: "jacket", price: 148, stock: 16 },
  { kind: "tote", price: 36, stock: 7 },
  { kind: "watch", price: 210, stock: 2, capacity: 12 },
  { kind: "lamp", price: 88, stock: 0 },
];

// 每件商品的款式與更新時間，順序同 items
const copy = {
  en: {
    variants: ["Size M, Olive", "Natural canvas", "Steel, 20 mm strap", "Matte black"],
    updated: ["Updated 2 min ago", "Updated 2 min ago", "Updated just now", "Restock in 2 weeks"],
  },
  "zh-TW": {
    variants: ["M 號，橄欖綠", "原色帆布", "不鏽鋼，20 mm 錶帶", "霧面黑"],
    updated: ["2 分鐘前更新", "2 分鐘前更新", "剛剛更新", "2 週後補貨"],
  },
  "zh-CN": {
    variants: ["M 码，橄榄绿", "本色帆布", "不锈钢，20 mm 表带", "哑光黑"],
    updated: ["2 分钟前更新", "2 分钟前更新", "刚刚更新", "2 周后补货"],
  },
  ja: {
    variants: ["M サイズ、オリーブ", "ナチュラルキャンバス", "ステンレス、20 mm ベルト", "マットブラック"],
    updated: ["2 分前に更新", "2 分前に更新", "たった今更新", "2 週間後に再入荷"],
  },
};

export default function LowStockIndicatorDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  return (
    <ul className="grid w-full max-w-[60rem] grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
      {items.map((item, i) => (
        <li key={item.kind} className="space-y-3">
          <ProductArt kind={item.kind} className="rounded-md" />
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium">{names[item.kind]}</p>
              <p className="text-sm tabular-nums">${item.price}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t.variants[i]}</p>
          </div>
          <LowStockIndicator locale={locale} stock={item.stock} capacity={item.capacity} updatedLabel={t.updated[i]} />
        </li>
      ))}
    </ul>
  );
}
