"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";
import { useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { AddToCartButton, CartIcon } from "./add-to-cart-button";

const products: { kind: ProductKind; price: string }[] = [
  { kind: "mug", price: "$24" },
  { kind: "tote", price: "$38" },
  { kind: "lamp", price: "$124" },
];

const photo = (kind: ProductKind) => `/blocks/add-to-cart-button/${kind}.webp`;

export default function AddToCartButtonDemo() {
  const locale = useDemoLocale();
  const productNames = useProductNames();
  const shop = useDemoText({ en: "Workroom Goods", "zh-TW": "工作室雜貨", "zh-CN": "工作室杂货", ja: "ワークルーム雑貨" });
  const cartRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(1);

  return (
    <div className="w-full max-w-3xl space-y-6">
      <header className="flex items-center justify-between border-b border-foreground/10 pb-3">
        <span className="text-sm font-semibold tracking-tight">{shop}</span>
        <CartIcon ref={cartRef} count={count} locale={locale} />
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.kind} className="group/item flex flex-col gap-3">
            <ProductPhoto src={photo(p.kind)} alt={productNames[p.kind]} />
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 font-medium">{productNames[p.kind]}</span>
              <span className="text-muted-foreground tabular-nums">{p.price}</span>
            </div>
            <AddToCartButton
              cartRef={cartRef}
              thumbnail={<img src={photo(p.kind)} alt="" />}
              tag={p.price}
              locale={locale}
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

/** Product photo: 12px radius, hairline drawn over the photo so it is not swallowed; the photo slowly zooms in a little on hover */
function ProductPhoto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-xl bg-muted", className)}>
      <img
        src={src}
        alt={alt}
        decoding="async"
        className="size-full object-cover transition-[scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/item:scale-[1.03] motion-reduce:transition-none"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-foreground/10 ring-inset" />
    </div>
  );
}
