"use client";

import { useRef, useState } from "react";

import { AddToCartButton, CartIcon } from "./add-to-cart-button";

const products = [
  { name: "Linen Shirt", price: "$58", from: "#f59e0b", to: "#ef4444" },
  { name: "Canvas Tote", price: "$24", from: "#10b981", to: "#0ea5e9" },
  { name: "Wool Beanie", price: "$32", from: "#8b5cf6", to: "#ec4899" },
];

function Swatch({ from, to }: { from: string; to: string }) {
  return <span className="block size-full" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />;
}

export default function AddToCartButtonDemo() {
  const cartRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(0);

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3 text-card-foreground">
        <span className="text-sm font-semibold tracking-tight">Northwind Supply</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCount(0)}
            className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Empty cart
          </button>
          <CartIcon ref={cartRef} count={count} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.name} className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
            <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl">
              <Swatch from={p.from} to={p.to} />
            </div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{p.price}</span>
            </div>
            <AddToCartButton
              cartRef={cartRef}
              thumbnail={<Swatch from={p.from} to={p.to} />}
              onAdd={() => new Promise((r) => setTimeout(r, 300))}
              onLand={() => setCount((c) => c + 1)}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
