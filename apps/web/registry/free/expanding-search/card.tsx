"use client";

import { useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { ExpandingSearch, type ExpandingSearchSuggestion } from "./expanding-search";

const catalog: { kind: ProductKind; category: string; price: string }[] = [
  { kind: "sneaker", category: "Shoes", price: "$88" },
  { kind: "jacket", category: "Outerwear", price: "$148" },
  { kind: "tote", category: "Bags", price: "$36" },
  { kind: "mug", category: "Kitchen", price: "$24" },
  { kind: "lamp", category: "Home", price: "$96" },
  { kind: "headphones", category: "Audio", price: "$210" },
];

const suggestions: ExpandingSearchSuggestion[] = catalog.map((p) => ({
  id: p.kind,
  label: productNames[p.kind],
  description: p.category,
  hint: p.price,
  thumbnail: <ProductArt kind={p.kind} />,
}));

/** 型錄卡片：頂列一個放大鏡，點開展成搜尋框並跳出商品建議。 */
export default function ExpandingSearchCard() {
  const [query, setQuery] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  return (
    <div className="mx-auto h-56 w-72 rounded-md border border-border bg-background text-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        {!searching && <span className="text-sm font-semibold tracking-tight whitespace-nowrap">Northwind</span>}
        <div className="ml-auto flex min-w-0 flex-1 justify-end">
          {/* 建議清單限高，留在卡片範圍內 */}
          <ExpandingSearch
            suggestions={suggestions}
            onOpenChange={setSearching}
            expandedWidth={260}
            placeholder="Search products"
            onSubmit={setQuery}
            onSuggestionSelect={(s) => setQuery(s.label)}
            className="[&_[role=listbox]]:max-h-36"
          />
        </div>
      </div>
      <p className="p-3 text-sm text-muted-foreground">{query ? `Results for "${query}"` : "Tap the magnifier to search."}</p>
    </div>
  );
}
