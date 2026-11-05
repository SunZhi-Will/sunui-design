"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { FavoriteButton } from "./favorite-button";

const products: { kind: ProductKind; price: string; saved?: boolean }[] = [
  { kind: "jacket", price: "$128", saved: true },
  { kind: "mug", price: "$22" },
  { kind: "lamp", price: "$86" },
  { kind: "watch", price: "$165" },
];

const copy = {
  en: { heading: "You may also like", save: (n: string) => `Save ${n}`, unsave: (n: string) => `Remove ${n} from saved` },
  "zh-TW": { heading: "你可能也會喜歡", save: (n: string) => `收藏 ${n}`, unsave: (n: string) => `把 ${n} 移出收藏` },
  "zh-CN": { heading: "你可能还会喜欢", save: (n: string) => `收藏 ${n}`, unsave: (n: string) => `把 ${n} 移出收藏` },
  ja: { heading: "こちらもおすすめ", save: (n: string) => `${n}を保存`, unsave: (n: string) => `${n}を保存から外す` },
};

export default function FavoriteButtonDemo() {
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="also-like" className="w-full max-w-3xl space-y-4">
      <h2 id="also-like" className="text-lg font-semibold tracking-tight">
        {t.heading}
      </h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.kind} {...p} />
        ))}
      </ul>
    </section>
  );
}

function ProductCard({ kind, price, saved = false }: (typeof products)[number]) {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [pressed, setPressed] = useState(saved);
  const name = useProductNames()[kind];

  return (
    <li className="min-w-0">
      <div className="relative">
        <ProductArt kind={kind} className="rounded-md" />
        <FavoriteButton
          size="md"
          locale={locale}
          pressed={pressed}
          onPressedChange={setPressed}
          labels={{ add: t.save(name), remove: t.unsave(name) }}
          className="absolute top-2 right-2"
        />
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="shrink-0 text-sm text-muted-foreground tabular-nums">{price}</p>
      </div>
    </li>
  );
}
