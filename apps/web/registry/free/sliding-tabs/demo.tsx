"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { SlidingTabs } from "./sliding-tabs";

type Product = { name: string; price: string; tags: string[] };

const copy = {
  en: {
    tabs: [
      { value: "details", label: "Details", content: "Midweight merino, 18.5 micron. Ribbed cuffs and hem, relaxed fit through the body." },
      { value: "care", label: "Care", content: "Hand wash cold or use the wool cycle. Dry flat, away from direct heat." },
      { value: "reviews", label: "Reviews", count: 128, content: "4.8 out of 5. Most say it runs true to size and softens after the first wash." },
    ],
    period: [
      { value: "d", label: "Day" },
      { value: "w", label: "Week" },
      { value: "m", label: "Month" },
    ],
    filters: [
      { value: "new", label: "New in" },
      { value: "sale", label: "On sale" },
      { value: "free", label: "Free shipping" },
    ],
    products: [
      { name: "Linen shirt", price: "$54", tags: ["new", "free"] },
      { name: "Canvas tote", price: "$22", tags: ["sale"] },
      { name: "Wool beanie", price: "$18", tags: ["new", "sale", "free"] },
      { name: "Denim jacket", price: "$96", tags: ["free"] },
    ] as Product[],
    sales: "Sales",
    filterLabel: "Filter products",
    empty: "Nothing matches every filter.",
  },
  "zh-TW": {
    tabs: [
      { value: "details", label: "商品說明", content: "中厚磅美麗諾羊毛，纖維 18.5 微米。羅紋袖口與下襬，身形寬鬆。" },
      { value: "care", label: "洗滌方式", content: "冷水手洗或使用羊毛洗程，平放陰乾，避免直接加熱。" },
      { value: "reviews", label: "評價", count: 128, content: "平均 4.8 分。多數人說尺寸正常，洗過一次後更柔軟。" },
    ],
    period: [
      { value: "d", label: "日" },
      { value: "w", label: "週" },
      { value: "m", label: "月" },
    ],
    filters: [
      { value: "new", label: "新品" },
      { value: "sale", label: "特價" },
      { value: "free", label: "免運" },
    ],
    products: [
      { name: "亞麻襯衫", price: "NT$1,580", tags: ["new", "free"] },
      { name: "帆布托特包", price: "NT$680", tags: ["sale"] },
      { name: "羊毛毛帽", price: "NT$520", tags: ["new", "sale", "free"] },
      { name: "丹寧外套", price: "NT$2,880", tags: ["free"] },
    ] as Product[],
    sales: "銷售額",
    filterLabel: "篩選商品",
    empty: "沒有同時符合所有條件的商品。",
  },
  "zh-CN": {
    tabs: [
      { value: "details", label: "商品详情", content: "中厚美丽诺羊毛，纤维 18.5 微米。罗纹袖口与下摆，版型宽松。" },
      { value: "care", label: "洗涤方式", content: "冷水手洗或使用羊毛洗程，平铺晾干，避免直接加热。" },
      { value: "reviews", label: "评价", count: 128, content: "平均 4.8 分。多数人说尺码标准，洗过一次后更柔软。" },
    ],
    period: [
      { value: "d", label: "日" },
      { value: "w", label: "周" },
      { value: "m", label: "月" },
    ],
    filters: [
      { value: "new", label: "新品" },
      { value: "sale", label: "特价" },
      { value: "free", label: "包邮" },
    ],
    products: [
      { name: "亚麻衬衫", price: "¥368", tags: ["new", "free"] },
      { name: "帆布托特包", price: "¥158", tags: ["sale"] },
      { name: "羊毛针织帽", price: "¥128", tags: ["new", "sale", "free"] },
      { name: "牛仔外套", price: "¥668", tags: ["free"] },
    ] as Product[],
    sales: "销售额",
    filterLabel: "筛选商品",
    empty: "没有同时符合所有条件的商品。",
  },
  ja: {
    tabs: [
      { value: "details", label: "商品詳細", content: "中厚手のメリノウール、18.5 マイクロン。リブ編みの袖口と裾、ゆったりした身幅。" },
      { value: "care", label: "お手入れ", content: "冷水で手洗い、またはウールコースで。平干しで直射熱を避けてください。" },
      { value: "reviews", label: "レビュー", count: 128, content: "平均 4.8。サイズ感は標準、一度洗うとさらに柔らかくなるという声が多数。" },
    ],
    period: [
      { value: "d", label: "日" },
      { value: "w", label: "週" },
      { value: "m", label: "月" },
    ],
    filters: [
      { value: "new", label: "新着" },
      { value: "sale", label: "セール" },
      { value: "free", label: "送料無料" },
    ],
    products: [
      { name: "リネンシャツ", price: "¥7,900", tags: ["new", "free"] },
      { name: "キャンバストート", price: "¥3,300", tags: ["sale"] },
      { name: "ウールビーニー", price: "¥2,600", tags: ["new", "sale", "free"] },
      { name: "デニムジャケット", price: "¥13,800", tags: ["free"] },
    ] as Product[],
    sales: "売上",
    filterLabel: "商品を絞り込む",
    empty: "すべての条件に合う商品はありません。",
  },
};

const bars: Record<string, number[]> = {
  d: [30, 45, 38, 60, 52, 70, 48],
  w: [55, 62, 48, 75, 80, 68, 90],
  m: [40, 58, 72, 66, 84, 92, 78],
};

export default function SlidingTabsDemo() {
  const t = useDemoText(copy);
  const [period, setPeriod] = useState("w");
  const [filters, setFilters] = useState<string[]>(["new"]);
  const shown = t.products.filter((p) => filters.every((f) => p.tags.includes(f)));

  return (
    <div className="grid w-full max-w-3xl gap-8 rounded-lg border bg-background p-6 md:grid-cols-2">
      <SlidingTabs
        items={t.tabs.map((tab) => ({ ...tab, content: <p className="pt-4 text-sm leading-relaxed text-muted-foreground">{tab.content}</p> }))}
        contentClassName="min-h-24"
      />

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{t.sales}</span>
          <SlidingTabs variant="segment" size="sm" items={t.period} value={period} onValueChange={setPeriod} aria-label={t.sales} />
        </div>
        <div aria-hidden="true" className="mt-4 flex h-24 items-end gap-2">
          {bars[period].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-[#1c1917]/80 transition-[height] duration-300 ease-out motion-reduce:transition-none dark:bg-[#ece7dc]/80" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <SlidingTabs
          multiple
          variant="chips"
          aria-label={t.filterLabel}
          items={t.filters.map((f) => ({ ...f, count: t.products.filter((p) => p.tags.includes(f.value)).length }))}
          value={filters}
          onValueChange={setFilters}
        />
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {t.products.map((p) => {
            const match = shown.includes(p);
            return (
              <li key={p.name} className="transition-opacity duration-200 motion-reduce:transition-none" style={{ opacity: match ? 1 : 0.25 }} aria-hidden={!match}>
                <div className="aspect-square rounded-md bg-muted" />
                <p className="mt-2 text-sm">{p.name}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{p.price}</p>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t.empty}</p>}
      </div>
    </div>
  );
}
