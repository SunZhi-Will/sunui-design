"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { QuantityStepper, type QuantityStepperSize } from "./quantity-stepper";

type Line = { id: string; name: string; variant: string; price: number; qty: number; from: string; to: string };

const initial: Line[] = [
  { id: "mug", name: "Stoneware Mug", variant: "Sand, 350 ml", price: 18, qty: 2, from: "#f59e0b", to: "#ef4444" },
  { id: "tote", name: "Canvas Tote", variant: "Natural", price: 24, qty: 1, from: "#10b981", to: "#0ea5e9" },
];

const money = (n: number) => `$${n.toFixed(2)}`;

export default function QuantityStepperDemo() {
  const reduce = useReducedMotion() ?? false;
  const [lines, setLines] = useState(initial);
  const [size, setSize] = useState<QuantityStepperSize>("md");
  const [removable, setRemovable] = useState(true);
  const [standalone, setStandalone] = useState(25);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Size" className="flex gap-1">
          {(["sm", "md"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className="rounded-full border border-border px-3 py-1.5 uppercase text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <label className="ml-2 flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={removable} onChange={(e) => setRemovable(e.target.checked)} className="size-4 accent-current" />
          Removable
        </label>
        <button
          type="button"
          onClick={() => setLines(initial)}
          className="ml-auto rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Reset cart
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card text-card-foreground">
        <ul className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.li
                key={l.id}
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  <span
                    className="size-14 shrink-0 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${l.from}, ${l.to})` }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.variant}, {money(l.price)} each
                    </p>
                  </div>
                  <QuantityStepper
                    size={size}
                    value={l.qty}
                    min={1}
                    max={10}
                    removable={removable}
                    onRemove={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                    onValueChange={(qty) => setLines((ls) => ls.map((x) => (x.id === l.id ? { ...x, qty } : x)))}
                    labels={{ quantity: `${l.name} quantity`, remove: `Remove ${l.name}` }}
                  />
                  <span className="w-16 text-right text-sm font-medium tabular-nums">{money(l.price * l.qty)}</span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {!lines.length && <p className="p-6 text-center text-sm text-muted-foreground">Your cart is empty.</p>}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold tabular-nums" aria-live="polite">
            {money(subtotal)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm text-card-foreground">
        <span>
          <span className="font-medium">Bulk order</span>
          <span className="block text-xs text-muted-foreground">Step 5, from 5 to 500. Hold + to repeat, PageUp jumps 50.</span>
        </span>
        <QuantityStepper size={size} value={standalone} min={5} max={500} step={5} onValueChange={setStandalone} />
      </div>
    </div>
  );
}
