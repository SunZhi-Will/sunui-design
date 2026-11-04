"use client";

import { PrintPreview } from "./print-preview";

type Line = { sku: string; name: string; qty: number; price: number };

const products = [
  "Stoneware Mug, Sand",
  "Canvas Tote, Natural",
  "Linen Napkins, Set of 4",
  "Walnut Serving Board",
  "Beeswax Candle, Tall",
  "Cotton Tea Towel",
  "Ceramic Bowl, Small",
];

// 28 筆品項，數量與價格依索引決定，讓伺服器與瀏覽器輸出一致
const lines: Line[] = Array.from({ length: 28 }, (_, i) => ({
  sku: `SU-${String(1040 + i * 7).padStart(5, "0")}`,
  name: products[i % products.length],
  qty: (i % 4) + 1,
  price: 8 + ((i * 13) % 37),
}));

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
const shipping = 12;
const tax = Math.round(subtotal * 0.05 * 100) / 100;

const chunks = Array.from({ length: Math.ceil(lines.length / 4) }, (_, i) => lines.slice(i * 4, i * 4 + 4));

const row = "grid grid-cols-[6rem_1fr_3rem_5rem_5.5rem] gap-3 py-2 text-[13px]";

export default function PrintPreviewDemo() {
  return (
    <section aria-labelledby="invoice-heading" className="w-full max-w-[52rem] space-y-4">
      <div>
        <h2 id="invoice-heading" className="text-xl font-semibold tracking-tight">
          Invoice SU-20481
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Preview before printing. Rows never split across pages.</p>
      </div>

      <PrintPreview header={() => <span className="font-mono tracking-[0.12em]">INVOICE SU-20481</span>}>
        <header className="flex items-start justify-between pb-6">
          <div>
            <p className="text-2xl font-semibold tracking-tight">Field &amp; Kiln</p>
            <p className="mt-1 text-[13px] opacity-60">12 Harbor Lane, Portland, OR 97209</p>
          </div>
          <div className="text-right text-[13px] tabular-nums">
            <p className="font-mono tracking-[0.12em]">SU-20481</p>
            <p className="opacity-60">Issued Nov 5, 2026</p>
            <p className="opacity-60">Due Nov 19, 2026</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 border-t border-dashed border-current/20 py-5 text-[13px]">
          <div>
            <p className="text-[11px] tracking-[0.14em] uppercase opacity-60">Bill to</p>
            <p className="mt-1 font-medium">Mia Chen</p>
            <p className="opacity-70">48 Elm Street, Apt 3</p>
            <p className="opacity-70">Seattle, WA 98101</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.14em] uppercase opacity-60">Ship to</p>
            <p className="mt-1 font-medium">Mia Chen</p>
            <p className="opacity-70">Same as billing</p>
          </div>
        </div>

        <div className={`${row} border-b border-current/20 text-[11px] tracking-[0.14em] uppercase opacity-60`}>
          <span>SKU</span>
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Amount</span>
        </div>

        {chunks.map((chunk, c) => (
          <div key={c} className="divide-y divide-dashed divide-current/15 border-b border-dashed border-current/15">
            {chunk.map((l) => (
              <div key={l.sku} className={row}>
                <span className="font-mono text-[12px] tracking-[0.08em] opacity-70">{l.sku}</span>
                <span className="truncate">{l.name}</span>
                <span className="text-right tabular-nums">{l.qty}</span>
                <span className="text-right tabular-nums">{money(l.price)}</span>
                <span className="text-right font-medium tabular-nums">{money(l.qty * l.price)}</span>
              </div>
            ))}
          </div>
        ))}

        <div className="ml-auto w-64 space-y-1.5 py-5 text-[13px] tabular-nums">
          <p className="flex justify-between">
            <span className="opacity-60">Subtotal</span>
            {money(subtotal)}
          </p>
          <p className="flex justify-between">
            <span className="opacity-60">Shipping</span>
            {money(shipping)}
          </p>
          <p className="flex justify-between">
            <span className="opacity-60">Tax (5%)</span>
            {money(tax)}
          </p>
          <p className="flex justify-between border-t border-current/20 pt-2 text-base font-semibold">
            <span>Total due</span>
            {money(subtotal + shipping + tax)}
          </p>
        </div>

        <div className="border-t border-dashed border-current/20 pt-4 text-[13px] opacity-70">
          <p className="font-medium">Notes</p>
          <p className="mt-1">
            Thank you for your order. Returns are accepted within 30 days of delivery in original condition. Questions about
            this invoice: billing@fieldandkiln.com.
          </p>
        </div>
      </PrintPreview>
    </section>
  );
}
