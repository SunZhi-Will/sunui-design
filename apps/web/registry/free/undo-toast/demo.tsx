"use client";

import { useState } from "react";

import { UndoToast, useUndo } from "./undo-toast";

type Line = { id: string; name: string; variant: string; price: number; qty: number };

const initial: Line[] = [
  { id: "mug", name: "Stoneware Mug", variant: "Sand, 350 ml", price: 18, qty: 2 },
  { id: "tote", name: "Canvas Tote", variant: "Natural", price: 24, qty: 1 },
  { id: "napkins", name: "Linen Napkins", variant: "Set of 4, Oat", price: 16, qty: 1 },
];

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function UndoToastDemo() {
  const [lines, setLines] = useState(initial);
  const { toast, run, undo, dismiss } = useUndo({ duration: 5000 });

  const remove = (line: Line) => {
    const index = lines.findIndex((l) => l.id === line.id);
    setLines((ls) => ls.filter((l) => l.id !== line.id));
    run(`Removed ${line.name}`, {
      // 放回原本的位置
      onUndo: () =>
        setLines((ls) => (ls.some((l) => l.id === line.id) ? ls : [...ls.slice(0, index), line, ...ls.slice(index)])),
    });
  };

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  return (
    <section aria-labelledby="cart-heading" className="relative w-full max-w-xl pb-24">
      <h2 id="cart-heading" className="text-xl font-semibold tracking-tight">
        Your cart
      </h2>
      <div className="mt-4 rounded-lg border border-border bg-card text-card-foreground">
        {lines.length ? (
          <ul className="divide-y divide-border">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center gap-4 p-4">
                <span aria-hidden="true" className="size-12 shrink-0 rounded-md bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.variant}, qty <span className="tabular-nums">{l.qty}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(l)}
                    className="mt-1 rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    Remove
                  </button>
                </div>
                <span className="text-sm font-medium tabular-nums">{money(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">Your cart is empty.</p>
        )}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold tabular-nums" aria-live="polite">
            {money(subtotal)}
          </span>
        </div>
      </div>

      <UndoToast toast={toast} onUndo={undo} onDismiss={dismiss} fixed={false} />
    </section>
  );
}
