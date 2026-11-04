"use client";

import { useRef, useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { AddToCartButton, CartIcon } from "./add-to-cart-button";

const products: { kind: ProductKind; price: string }[] = [
  { kind: "mug", price: "$24" },
  { kind: "tote", price: "$38" },
  { kind: "lamp", price: "$124" },
];

export default function AddToCartButtonDemo() {
  const cartRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(1);

  return (
    <div className="w-full max-w-3xl space-y-6">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-sm font-semibold tracking-tight">Workroom Goods</span>
        <CartIcon ref={cartRef} count={count} />
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.kind} className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-md border border-[#e7e0d0] dark:border-[#38332b]">
              <ProductArt kind={p.kind} />
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{productNames[p.kind]}</span>
              <span className="text-muted-foreground tabular-nums">{p.price}</span>
            </div>
            <AddToCartButton
              cartRef={cartRef}
              thumbnail={<ProductArt kind={p.kind} />}
              tag={p.price}
              onAdd={() => new Promise((r) => setTimeout(r, 250))}
              onLand={() => setCount((c) => c + 1)}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
