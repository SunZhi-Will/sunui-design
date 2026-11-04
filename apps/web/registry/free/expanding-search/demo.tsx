"use client";

import { useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { ExpandingSearch, type ExpandingSearchSuggestion } from "./expanding-search";

const catalog: { kind: ProductKind; category: string; price: string }[] = [
  { kind: "sneaker", category: "Shoes", price: "$88" },
  { kind: "jacket", category: "Outerwear", price: "$148" },
  { kind: "tote", category: "Bags", price: "$36" },
  { kind: "mug", category: "Kitchen", price: "$24" },
  { kind: "bottle", category: "Kitchen", price: "$32" },
  { kind: "lamp", category: "Home", price: "$96" },
  { kind: "headphones", category: "Audio", price: "$210" },
  { kind: "watch", category: "Accessories", price: "$185" },
];

const suggestions: ExpandingSearchSuggestion[] = catalog.map((p) => ({
  id: p.kind,
  label: productNames[p.kind],
  description: p.category,
  hint: p.price,
  thumbnail: <ProductArt kind={p.kind} />,
}));

export default function ExpandingSearchDemo() {
  const [query, setQuery] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const q = query?.toLowerCase() ?? "";
  const shown = catalog.filter((p) => !q || productNames[p.kind].toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 4);

  return (
    <div className="w-full max-w-3xl rounded-md border border-border bg-background text-foreground">
      <header className="flex h-16 items-center gap-6 border-b border-border px-4 sm:px-5">
        <span className={searching ? "hidden text-sm font-semibold tracking-tight whitespace-nowrap sm:inline" : "text-sm font-semibold tracking-tight whitespace-nowrap"}>
          Northwind Supply
        </span>
        <nav aria-label="Main" className="hidden gap-5 text-sm text-muted-foreground md:flex">
          {["New", "Shop", "Sale"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              {l}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1">
          <ExpandingSearch
            suggestions={suggestions}
            slashShortcut
            onOpenChange={setSearching}
            expandedWidth={300}
            placeholder="Search products"
            onSubmit={setQuery}
            onSuggestionSelect={(s) => setQuery(s.label)}
          />
          <a href="#cart" aria-label="Cart, 2 items" className="flex size-10 shrink-0 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1.2 11H6.2Z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
          </a>
        </div>
      </header>

      <main className="p-4 sm:p-5">
        <h2 className="text-base font-semibold tracking-tight">{query ? `Results for "${query}"` : "New this week"}</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shown.map((p) => (
            <li key={p.kind}>
              <ProductArt kind={p.kind} className="rounded-[3px]" />
              <p className="mt-2 truncate text-sm">{productNames[p.kind]}</p>
              <p className="text-sm font-medium tracking-tight tabular-nums">{p.price}</p>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No products match. Try a shorter word.</p>}
      </main>
    </div>
  );
}
