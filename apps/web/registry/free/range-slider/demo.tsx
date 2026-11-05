"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { RangeSlider } from "./range-slider";

const copy = {
  en: { filter: "Filter", price: "Price", rating: "Minimum rating", results: (n: number) => `${n} products`, low: "Lowest price", high: "Highest price", currency: (n: number) => `$${n}`, stars: (n: number) => `${n.toFixed(1)} ★` },
  "zh-TW": { filter: "篩選", price: "價格", rating: "最低評分", results: (n: number) => `共 ${n} 件商品`, low: "最低價", high: "最高價", currency: (n: number) => `NT$${(n * 30).toLocaleString()}`, stars: (n: number) => `${n.toFixed(1)} ★` },
  "zh-CN": { filter: "筛选", price: "价格", rating: "最低评分", results: (n: number) => `共 ${n} 件商品`, low: "最低价", high: "最高价", currency: (n: number) => `¥${(n * 7).toLocaleString()}`, stars: (n: number) => `${n.toFixed(1)} ★` },
  ja: { filter: "絞り込み", price: "価格", rating: "評価の下限", results: (n: number) => `${n} 件の商品`, low: "最低価格", high: "最高価格", currency: (n: number) => `¥${(n * 150).toLocaleString()}`, stars: (n: number) => `${n.toFixed(1)} ★` },
};

export default function RangeSliderDemo() {
  const t = useDemoText(copy);
  const [price, setPrice] = useState<[number, number]>([20, 120]);
  const [rating, setRating] = useState(4);
  const count = Math.max(0, Math.round((price[1] - price[0]) * 1.4 - (rating - 3) * 30));

  return (
    <div className="w-full max-w-sm rounded-lg border bg-background p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <span className="text-base font-semibold tracking-tight">{t.filter}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{t.results(count)}</span>
      </div>
      <div className="space-y-8">
        <RangeSlider label={t.price} value={price} onValueChange={setPrice} min={0} max={200} step={5} minGap={10} format={t.currency} thumbLabels={[t.low, t.high]} name="price" />
        <RangeSlider label={t.rating} value={rating} onValueChange={setRating} min={1} max={5} step={0.5} ticks={8} format={t.stars} thumbLabels={t.rating} />
      </div>
    </div>
  );
}
