"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { SidePanel } from "./side-panel";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const paperUnder = "bg-[#f1ebdd] dark:bg-[#29251f]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const products = [
  { name: "Linen overshirt", price: 128, color: "Oat" },
  { name: "Wide-leg trousers", price: 96, color: "Charcoal" },
  { name: "Washed linen shirt", price: 84, color: "Undyed" },
  { name: "Linen apron", price: 42, color: "Olive" },
];

const bag = [
  { name: "Linen overshirt", detail: "Oat, M", price: 128 },
  { name: "Washed linen shirt", detail: "Undyed, L", price: 84 },
];

const sizes = ["XS", "S", "M", "L", "XL"];
const colors = ["Undyed", "Oat", "Charcoal", "Olive"];

const money = (n: number) => `$${n}`;
const trigger =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium outline-none hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring";
const primary =
  "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function SidePanelDemo() {
  const [panel, setPanel] = useState<"filters" | "bag" | null>(null);
  const [picked, setPicked] = useState<string[]>(["M"]);
  const close = (open: boolean) => !open && setPanel(null);
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <div className={cn("relative h-[30rem] w-full max-w-3xl overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("flex items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5", edge)}>
        <button type="button" onClick={() => setPanel("filters")} className={trigger}>
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" />
          </svg>
          Filters{picked.length > 0 && <span className={cn("tabular-nums", inkMuted)}>({picked.length})</span>}
        </button>
        <span className="text-sm font-semibold tracking-tight">Linen, autumn</span>
        <button type="button" onClick={() => setPanel("bag")} className={trigger}>
          Bag <span className={cn("tabular-nums", inkMuted)}>({bag.length})</span>
        </button>
      </header>

      <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
        {products.map((p) => (
          <li key={p.name} className="text-sm">
            <div aria-hidden="true" className={cn("aspect-[4/3] rounded-[3px]", paperUnder)} />
            <p className="mt-2 font-medium">{p.name}</p>
            <p className={cn("tabular-nums", inkMuted)}>
              {p.color}, {money(p.price)}
            </p>
          </li>
        ))}
      </ul>

      <SidePanel
        open={panel === "filters"}
        onOpenChange={close}
        side="left"
        size="sm"
        portal={false}
        title="Filters"
        description="24 pieces in linen."
        footer={
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => setPicked([])} className={cn(trigger, "px-0")}>
              Clear all
            </button>
            <button type="button" onClick={() => setPanel(null)} className={primary}>
              Show results
            </button>
          </div>
        }
      >
        <fieldset className="space-y-2.5">
          <legend className={cn("mb-2.5 text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>Size</legend>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <label key={s} className={cn("relative cursor-pointer rounded-[3px] border px-2.5 py-1 text-sm tabular-nums has-[:checked]:border-[#1c1917] has-[:checked]:bg-[#1c1917] has-[:checked]:text-[#faf7f0] dark:has-[:checked]:border-[#ece7dc] dark:has-[:checked]:bg-[#ece7dc] dark:has-[:checked]:text-[#1f1c18] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", edge)}>
                <input type="checkbox" checked={picked.includes(s)} onChange={() => toggle(s)} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className={cn("mb-2.5 text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>Color</legend>
          <div className="space-y-2 text-sm">
            {colors.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={picked.includes(c)} onChange={() => toggle(c)} className="size-4 accent-[#1c1917] dark:accent-[#ece7dc]" />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      </SidePanel>

      <SidePanel
        open={panel === "bag"}
        onOpenChange={close}
        side="right"
        size="sm"
        portal={false}
        title="Your bag"
        description="Free shipping over $80."
        footer={
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={inkMuted}>Subtotal</span>
              <span className="font-semibold tabular-nums">{money(bag.reduce((n, b) => n + b.price, 0))}</span>
            </div>
            <button type="button" className={cn(primary, "w-full")}>
              Checkout
            </button>
          </div>
        }
      >
        <ul className={cn("divide-y", "divide-[#e7e0d0] dark:divide-[#38332b]")}>
          {bag.map((b) => (
            <li key={b.name} className="flex gap-3 py-3 first:pt-0">
              <div aria-hidden="true" className={cn("h-16 w-13 shrink-0 rounded-[3px]", paperUnder)} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{b.name}</p>
                <p className={inkMuted}>{b.detail}</p>
              </div>
              <span className="text-sm tabular-nums">{money(b.price)}</span>
            </li>
          ))}
        </ul>
      </SidePanel>
    </div>
  );
}
