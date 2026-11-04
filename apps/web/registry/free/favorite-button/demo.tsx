"use client";

import { useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { FavoriteButton } from "./favorite-button";

const products: { kind: ProductKind; price: string; saved?: boolean }[] = [
  { kind: "jacket", price: "$128", saved: true },
  { kind: "mug", price: "$22" },
  { kind: "lamp", price: "$86" },
  { kind: "watch", price: "$165" },
];

export default function FavoriteButtonDemo() {
  return (
    <section aria-labelledby="also-like" className="w-full max-w-3xl space-y-4">
      <h2 id="also-like" className="text-lg font-semibold tracking-tight">
        You may also like
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
  const [pressed, setPressed] = useState(saved);
  const name = productNames[kind];

  return (
    <li className="min-w-0">
      <div className="relative">
        <ProductArt kind={kind} className="rounded-md" />
        <FavoriteButton
          size="md"
          pressed={pressed}
          onPressedChange={setPressed}
          labels={{ add: `Save ${name}`, remove: `Remove ${name} from saved` }}
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
