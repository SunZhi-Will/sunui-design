"use client";

import { useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { ToastStack, useToasts } from "./toast-stack";

const products: { kind: ProductKind; variant: string; price: string; soldOut?: boolean }[] = [
  { kind: "sneaker", variant: "Chalk, size 42", price: "$88" },
  { kind: "mug", variant: "Oat glaze, 350 ml", price: "$24" },
  { kind: "jacket", variant: "Navy canvas, M", price: "$148", soldOut: true },
  { kind: "tote", variant: "Natural, one size", price: "$36" },
];

export default function ToastStackDemo() {
  const { toasts, push, dismiss } = useToasts();
  const [cart, setCart] = useState(2);

  const add = (kind: ProductKind, variant: string) => {
    setCart((n) => n + 1);
    push({
      title: "Added to cart",
      description: `${productNames[kind]}, ${variant}`,
      media: <ProductArt kind={kind} />,
      action: {
        label: "Undo",
        onClick: () => {
          setCart((n) => Math.max(0, n - 1));
          push({ title: "Removed from cart", description: productNames[kind], tone: "info" });
        },
      },
    });
  };

  return (
    <div className="relative h-[460px] w-full max-w-2xl overflow-hidden rounded-md border border-border bg-background text-foreground">
      <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight">New this week</h2>
        <span className="text-sm text-muted-foreground tabular-nums">Cart ({cart})</span>
      </div>
      <ul className="divide-y divide-border">
        {products.map((p) => (
          <li key={p.kind} className="flex items-center gap-3 px-5 py-3">
            <ProductArt kind={p.kind} className="size-12 shrink-0 rounded-[3px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{productNames[p.kind]}</p>
              <p className="truncate text-xs text-muted-foreground">{p.variant}</p>
            </div>
            <span className="text-sm font-medium tracking-tight tabular-nums">{p.price}</span>
            {p.soldOut ? (
              <button
                type="button"
                onClick={() =>
                  push({ title: "We'll email you", description: `When the ${productNames[p.kind]} is back in M.`, tone: "success" })
                }
                className="w-28 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Notify me
              </button>
            ) : (
              <button
                type="button"
                onClick={() => add(p.kind, p.variant)}
                className="w-28 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Add to cart
              </button>
            )}
          </li>
        ))}
      </ul>
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} />
    </div>
  );
}
