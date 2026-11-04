"use client";

import { WindowFrame } from "./window-frame";

const orders = [
  ["SU-20481", "Mia Chen", "$128.00", "paid"],
  ["SU-20480", "Leo Park", "$64.50", "paid"],
  ["SU-20479", "Ana Ruiz", "$219.00", "pending"],
  ["SU-20478", "Ben Ito", "$42.00", "refunded"],
];

export default function WindowFrameDemo() {
  return (
    <section className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">How your store looks</h2>
        <p className="mt-1 text-sm text-muted-foreground">The same catalog on desktop, on a phone and in your order export.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <WindowFrame variant="browser" url="shop.example.com/products/stoneware-mug" caption="Product page, desktop">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div className="aspect-square rounded-md border border-border bg-muted" aria-hidden="true" />
            <div className="space-y-2">
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Kitchen</p>
              <p className="text-lg font-semibold tracking-tight">Stoneware Mug</p>
              <p className="font-semibold tabular-nums">$18.00</p>
              <p className="text-sm text-muted-foreground">Hand-glazed, 350 ml. Dishwasher safe.</p>
              <span className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Add to cart</span>
            </div>
          </div>
        </WindowFrame>

        <WindowFrame variant="phone" tone="success" caption="Checkout passed" height={300}>
          <div className="space-y-3 p-3 text-sm">
            <p className="font-semibold">Cart</p>
            {[
              ["Stoneware Mug", "$36.00"],
              ["Canvas Tote", "$24.00"],
              ["Linen Napkins", "$16.00"],
            ].map(([name, price]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="size-9 shrink-0 rounded-md border border-border bg-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="tabular-nums">{price}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">$76.00</span>
            </div>
            <span className="block rounded-md bg-primary py-2 text-center font-medium text-primary-foreground">Pay $76.00</span>
          </div>
        </WindowFrame>
      </div>

      <WindowFrame variant="mac" title="orders.csv" right={<span className="text-[11px] text-muted-foreground tabular-nums">4 rows</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] font-mono text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border text-left">
                {["order", "customer", "total", "status"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => (
                <tr key={row[0]} className="border-b border-border last:border-0">
                  {row.map((cell, i) => (
                    <td key={i} className={i === 2 ? "px-3 py-2 tabular-nums" : "px-3 py-2"}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WindowFrame>
    </section>
  );
}
