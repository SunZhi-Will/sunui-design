"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { QuantityStepper } from "./quantity-stepper";

type Line = { kind: ProductKind; variant: string; price: number; qty: number; max: number };

const initial: Line[] = [
  { kind: "mug", variant: "Sand, 350 ml", price: 22, qty: 2, max: 10 },
  { kind: "tote", variant: "Natural", price: 48, qty: 1, max: 10 },
  { kind: "bottle", variant: "Brushed steel", price: 34, qty: 3, max: 3 },
];

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function QuantityStepperDemo() {
  const reduce = useReducedMotion() ?? false;
  const [lines, setLines] = useState(initial);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <section aria-labelledby="bag-heading" className="w-full max-w-xl rounded-md border border-border bg-card text-card-foreground">
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h2 id="bag-heading" className="font-semibold tracking-tight">
          Your bag
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">{count} items</span>
      </header>

      <ul>
        <AnimatePresence initial={false}>
          {lines.map((l) => {
            const name = productNames[l.kind];
            return (
              <motion.li
                key={l.kind}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 30 }}
                className="overflow-hidden border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3 p-4 sm:gap-4">
                  <ProductArt kind={l.kind} className="size-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.variant}, {money(l.price)}
                    </p>
                    {l.qty >= l.max && <p className="text-xs text-muted-foreground">Limit {l.max} per order</p>}
                  </div>
                  <QuantityStepper
                    size="sm"
                    value={l.qty}
                    max={l.max}
                    removable
                    onRemove={() => setLines((ls) => ls.filter((x) => x.kind !== l.kind))}
                    onValueChange={(qty) => setLines((ls) => ls.map((x) => (x.kind === l.kind ? { ...x, qty } : x)))}
                    labels={{ quantity: `${name} quantity`, remove: `Remove ${name}` }}
                  />
                  <span className="hidden w-16 text-right text-sm font-medium tabular-nums sm:block">{money(l.price * l.qty)}</span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {!lines.length && <p className="p-6 text-center text-sm text-muted-foreground">Your bag is empty.</p>}

      <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold tracking-tight tabular-nums">{money(subtotal)}</span>
      </footer>
    </section>
  );
}
