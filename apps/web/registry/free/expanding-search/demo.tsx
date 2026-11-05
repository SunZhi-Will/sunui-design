"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { ExpandingSearch, type ExpandingSearchSuggestion } from "./expanding-search";

type Category = "shoes" | "outerwear" | "bags" | "kitchen" | "home" | "audio" | "accessories";

const catalog: { kind: ProductKind; category: Category; price: string }[] = [
  { kind: "sneaker", category: "shoes", price: "$88" },
  { kind: "jacket", category: "outerwear", price: "$148" },
  { kind: "tote", category: "bags", price: "$36" },
  { kind: "mug", category: "kitchen", price: "$24" },
  { kind: "bottle", category: "kitchen", price: "$32" },
  { kind: "lamp", category: "home", price: "$96" },
  { kind: "headphones", category: "audio", price: "$210" },
  { kind: "watch", category: "accessories", price: "$185" },
];

const copy = {
  en: {
    categories: { shoes: "Shoes", outerwear: "Outerwear", bags: "Bags", kitchen: "Kitchen", home: "Home", audio: "Audio", accessories: "Accessories" },
    nav: ["New", "Shop", "Sale"],
    main: "Main",
    placeholder: "Search products",
    cart: "Cart, 2 items",
    results: (q: string) => `Results for "${q}"`,
    fresh: "New this week",
    empty: "No products match. Try a shorter word.",
  },
  "zh-TW": {
    categories: { shoes: "鞋款", outerwear: "外套", bags: "包款", kitchen: "廚房", home: "居家", audio: "音響", accessories: "配件" },
    nav: ["新品", "商店", "特價"],
    main: "主選單",
    placeholder: "搜尋商品",
    cart: "購物車，2 件商品",
    results: (q: string) => `「${q}」的搜尋結果`,
    fresh: "本週新品",
    empty: "沒有符合的商品，試試更短的關鍵字。",
  },
  "zh-CN": {
    categories: { shoes: "鞋履", outerwear: "外套", bags: "包袋", kitchen: "厨房", home: "家居", audio: "音频", accessories: "配饰" },
    nav: ["新品", "商店", "特价"],
    main: "主导航",
    placeholder: "搜索商品",
    cart: "购物车，2 件商品",
    results: (q: string) => `“${q}”的搜索结果`,
    fresh: "本周新品",
    empty: "没有匹配的商品，试试更短的关键词。",
  },
  ja: {
    categories: { shoes: "シューズ", outerwear: "アウター", bags: "バッグ", kitchen: "キッチン", home: "ホーム", audio: "オーディオ", accessories: "アクセサリー" },
    nav: ["新着", "ショップ", "セール"],
    main: "メイン",
    placeholder: "商品を検索",
    cart: "カート、2点",
    results: (q: string) => `「${q}」の検索結果`,
    fresh: "今週の新着",
    empty: "一致する商品がありません。短い言葉でお試しください。",
  },
};

export default function ExpandingSearchDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  const [query, setQuery] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const q = query?.toLowerCase() ?? "";
  const shown = catalog
    .filter((p) => !q || names[p.kind].toLowerCase().includes(q) || t.categories[p.category].toLowerCase().includes(q))
    .slice(0, 4);
  const suggestions: ExpandingSearchSuggestion[] = catalog.map((p) => ({
    id: p.kind,
    label: names[p.kind],
    description: t.categories[p.category],
    hint: p.price,
    thumbnail: <ProductArt kind={p.kind} />,
  }));

  return (
    <div className="w-full max-w-3xl rounded-md border border-border bg-background text-foreground">
      <header className="flex h-16 items-center gap-6 border-b border-border px-4 sm:px-5">
        <span className={searching ? "hidden text-sm font-semibold tracking-tight whitespace-nowrap sm:inline" : "text-sm font-semibold tracking-tight whitespace-nowrap"}>
          Northwind Supply
        </span>
        <nav aria-label={t.main} className="hidden gap-5 text-sm whitespace-nowrap text-muted-foreground md:flex">
          {t.nav.map((l, i) => (
            <a key={i} href={`#${["new", "shop", "sale"][i]}`} className="rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              {l}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1">
          <ExpandingSearch
            locale={locale}
            suggestions={suggestions}
            slashShortcut
            onOpenChange={setSearching}
            expandedWidth={300}
            placeholder={t.placeholder}
            onSubmit={setQuery}
            onSuggestionSelect={(s) => setQuery(s.label)}
          />
          <a href="#cart" aria-label={t.cart} className="flex size-10 shrink-0 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1.2 11H6.2Z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
          </a>
        </div>
      </header>

      <main className="p-4 sm:p-5">
        <h2 className="text-base font-semibold tracking-tight">{query ? t.results(query) : t.fresh}</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shown.map((p) => (
            <li key={p.kind}>
              <ProductArt kind={p.kind} className="rounded-[3px]" />
              <p className="mt-2 truncate text-sm">{names[p.kind]}</p>
              <p className="text-sm font-medium tracking-tight tabular-nums">{p.price}</p>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t.empty}</p>}
      </main>
    </div>
  );
}
