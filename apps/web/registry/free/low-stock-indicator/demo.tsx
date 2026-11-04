"use client";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { LowStockIndicator } from "./low-stock-indicator";

const items: { kind: ProductKind; variant: string; price: number; stock: number; capacity?: number; updated: string }[] = [
  { kind: "jacket", variant: "Size M, Olive", price: 148, stock: 16, updated: "Updated 2 min ago" },
  { kind: "tote", variant: "Natural canvas", price: 36, stock: 7, updated: "Updated 2 min ago" },
  { kind: "watch", variant: "Steel, 20 mm strap", price: 210, stock: 2, capacity: 12, updated: "Updated just now" },
  { kind: "lamp", variant: "Matte black", price: 88, stock: 0, updated: "Restock in 2 weeks" },
];

export default function LowStockIndicatorDemo() {
  return (
    <ul className="grid w-full max-w-[60rem] grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
      {items.map((item) => (
        <li key={item.kind} className="space-y-3">
          <ProductArt kind={item.kind} className="rounded-md" />
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium">{productNames[item.kind]}</p>
              <p className="text-sm tabular-nums">${item.price}</p>
            </div>
            <p className="text-xs text-muted-foreground">{item.variant}</p>
          </div>
          <LowStockIndicator stock={item.stock} capacity={item.capacity} updatedLabel={item.updated} />
        </li>
      ))}
    </ul>
  );
}
