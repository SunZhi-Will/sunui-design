"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { ExpandingSearch, type ExpandingSearchSuggestion } from "./expanding-search";

type Category = "shoes" | "outerwear" | "bags" | "kitchen" | "home" | "audio";

const catalog: { kind: ProductKind; category: Category; price: string }[] = [
  { kind: "sneaker", category: "shoes", price: "$88" },
  { kind: "jacket", category: "outerwear", price: "$148" },
  { kind: "tote", category: "bags", price: "$36" },
  { kind: "mug", category: "kitchen", price: "$24" },
  { kind: "lamp", category: "home", price: "$96" },
  { kind: "headphones", category: "audio", price: "$210" },
];

const copy = {
  en: {
    categories: { shoes: "Shoes", outerwear: "Outerwear", bags: "Bags", kitchen: "Kitchen", home: "Home", audio: "Audio" },
    placeholder: "Search products",
    results: (q: string) => `Results for "${q}"`,
    hint: "Tap the magnifier to search.",
  },
  "zh-TW": {
    categories: { shoes: "鞋款", outerwear: "外套", bags: "包款", kitchen: "廚房", home: "居家", audio: "音響" },
    placeholder: "搜尋商品",
    results: (q: string) => `「${q}」的搜尋結果`,
    hint: "點放大鏡開始搜尋。",
  },
  "zh-CN": {
    categories: { shoes: "鞋履", outerwear: "外套", bags: "包袋", kitchen: "厨房", home: "家居", audio: "音频" },
    placeholder: "搜索商品",
    results: (q: string) => `“${q}”的搜索结果`,
    hint: "点放大镜开始搜索。",
  },
  ja: {
    categories: { shoes: "シューズ", outerwear: "アウター", bags: "バッグ", kitchen: "キッチン", home: "ホーム", audio: "オーディオ" },
    placeholder: "商品を検索",
    results: (q: string) => `「${q}」の検索結果`,
    hint: "虫めがねをタップして検索。",
  },
};

/** 型錄卡片：頂列一個放大鏡，點開展成搜尋框並跳出商品建議。 */
export default function ExpandingSearchCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  const [query, setQuery] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const suggestions: ExpandingSearchSuggestion[] = catalog.map((p) => ({
    id: p.kind,
    label: names[p.kind],
    description: t.categories[p.category],
    hint: p.price,
    thumbnail: <ProductArt kind={p.kind} />,
  }));

  return (
    <div className="mx-auto h-56 w-72 rounded-md border border-border bg-background text-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        {!searching && <span className="text-sm font-semibold tracking-tight whitespace-nowrap">Northwind</span>}
        <div className="ml-auto flex min-w-0 flex-1 justify-end">
          {/* 建議清單限高，留在卡片範圍內 */}
          <ExpandingSearch
            locale={locale}
            suggestions={suggestions}
            onOpenChange={setSearching}
            expandedWidth={260}
            placeholder={t.placeholder}
            onSubmit={setQuery}
            onSuggestionSelect={(s) => setQuery(s.label)}
            className="[&_[role=listbox]]:max-h-36"
          />
        </div>
      </div>
      <p className="p-3 text-sm text-muted-foreground">{query ? t.results(query) : t.hint}</p>
    </div>
  );
}
