"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { QuantityStepper } from "./quantity-stepper";

type VariantKey = "sand" | "natural" | "steel";
type Line = { kind: ProductKind; variant: VariantKey; price: number; qty: number; max: number };

const initial: Line[] = [
  { kind: "mug", variant: "sand", price: 22, qty: 2, max: 10 },
  { kind: "tote", variant: "natural", price: 48, qty: 1, max: 10 },
  { kind: "bottle", variant: "steel", price: 34, qty: 3, max: 3 },
];

const copy = {
  en: {
    heading: "Your bag",
    items: (n: number) => `${n} items`,
    variants: { sand: "Sand, 350 ml", natural: "Natural", steel: "Brushed steel" },
    limit: (n: number) => `Limit ${n} per order`,
    quantity: (name: string) => `${name} quantity`,
    remove: (name: string) => `Remove ${name}`,
    empty: "Your bag is empty.",
    subtotal: "Subtotal",
  },
  "zh-TW": {
    heading: "你的購物袋",
    items: (n: number) => `${n} 件商品`,
    variants: { sand: "沙色，350 ml", natural: "原色", steel: "霧面不鏽鋼" },
    limit: (n: number) => `每筆訂單限購 ${n} 件`,
    quantity: (name: string) => `${name} 數量`,
    remove: (name: string) => `移除 ${name}`,
    empty: "購物袋是空的。",
    subtotal: "小計",
  },
  "zh-CN": {
    heading: "你的购物袋",
    items: (n: number) => `${n} 件商品`,
    variants: { sand: "沙色，350 ml", natural: "本色", steel: "拉丝不锈钢" },
    limit: (n: number) => `每单限购 ${n} 件`,
    quantity: (name: string) => `${name} 数量`,
    remove: (name: string) => `移除 ${name}`,
    empty: "购物袋是空的。",
    subtotal: "小计",
  },
  ja: {
    heading: "ショッピングバッグ",
    items: (n: number) => `${n} 点`,
    variants: { sand: "サンド、350 ml", natural: "ナチュラル", steel: "ヘアライン仕上げ" },
    limit: (n: number) => `1 回のご注文につき ${n} 点まで`,
    quantity: (name: string) => `${name}の数量`,
    remove: (name: string) => `${name}を削除`,
    empty: "バッグに商品はありません。",
    subtotal: "小計",
  },
};

export default function QuantityStepperDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n);
  const reduce = useReducedMotion() ?? false;
  const [lines, setLines] = useState(initial);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <section aria-labelledby="bag-heading" className="w-full max-w-xl rounded-md border border-border bg-card text-card-foreground">
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h2 id="bag-heading" className="font-semibold tracking-tight">
          {t.heading}
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">{t.items(count)}</span>
      </header>

      <ul>
        <AnimatePresence initial={false}>
          {lines.map((l) => {
            const name = names[l.kind];
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
                      {t.variants[l.variant]}, {money(l.price)}
                    </p>
                    {l.qty >= l.max && <p className="text-xs text-muted-foreground">{t.limit(l.max)}</p>}
                  </div>
                  <QuantityStepper
                    size="sm"
                    locale={locale}
                    value={l.qty}
                    max={l.max}
                    removable
                    onRemove={() => setLines((ls) => ls.filter((x) => x.kind !== l.kind))}
                    onValueChange={(qty) => setLines((ls) => ls.map((x) => (x.kind === l.kind ? { ...x, qty } : x)))}
                    labels={{ quantity: t.quantity(name), remove: t.remove(name) }}
                  />
                  <span className="hidden w-16 text-right text-sm font-medium tabular-nums sm:block">{money(l.price * l.qty)}</span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {!lines.length && <p className="p-6 text-center text-sm text-muted-foreground">{t.empty}</p>}

      <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <span className="text-muted-foreground">{t.subtotal}</span>
        <span className="font-semibold tracking-tight tabular-nums">{money(subtotal)}</span>
      </footer>
    </section>
  );
}
