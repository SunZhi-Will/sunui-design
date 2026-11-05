"use client";

import { useRef, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { AddToCartButton, CartIcon } from "./add-to-cart-button";

/** 型錄卡片：一件商品、一顆按鈕、一個購物車，只看價格標籤飛進去那一下。 */
export default function AddToCartButtonCard() {
  const locale = useDemoLocale();
  const names = useProductNames();
  const cartRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(0);

  return (
    <div className="mx-auto flex w-60 items-end gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="h-28 overflow-hidden rounded-md border border-[#e7e0d0] dark:border-[#38332b] [&>*]:h-full">
          <ProductArt kind="mug" />
        </div>
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium">{names.mug}</span>
          <span className="text-muted-foreground tabular-nums">$24</span>
        </div>
        <AddToCartButton
          cartRef={cartRef}
          thumbnail={<ProductArt kind="mug" />}
          tag="$24"
          locale={locale}
          onAdd={() => new Promise((r) => setTimeout(r, 250))}
          onLand={() => setCount((c) => c + 1)}
          className="w-full"
        />
      </div>
      <div className="self-start">
        <CartIcon ref={cartRef} count={count} locale={locale} />
      </div>
    </div>
  );
}
