"use client";

import { useEffect, useState } from "react";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { SkeletonSet } from "./skeleton-set";

const picks: { kind: ProductKind; detail: string; price: string }[] = [
  { kind: "bottle", detail: "Brushed steel", price: "$32" },
  { kind: "lamp", detail: "Powder-coated, warm white", price: "$96" },
  { kind: "watch", detail: "Canvas strap", price: "$185" },
];

const orders = [
  { kind: "sneaker" as ProductKind, no: "SU-24817", date: "Oct 28", status: "Delivered", total: "$88.00" },
  { kind: "mug" as ProductKind, no: "SU-24602", date: "Oct 14", status: "Delivered", total: "$48.00" },
  { kind: "tote" as ProductKind, no: "SU-24391", date: "Sep 30", status: "Returned", total: "$36.00" },
];

/** 每區塊的資料到達時間不同，像真實頁面陸續載入；工具列的 Replay 會重來一次 */
const ARRIVAL = [900, 1500, 2100, 2700];

export default function SkeletonSetDemo() {
  const [arrived, setArrived] = useState(0);

  useEffect(() => {
    const timers = ARRIVAL.map((ms, i) => window.setTimeout(() => setArrived(i + 1), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div className="w-full max-w-3xl space-y-8 text-foreground">
      <section aria-labelledby="picks-heading">
        <h2 id="picks-heading" className="mb-3 text-base font-semibold tracking-tight">
          Picked for you
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {picks.map((p, i) => (
            <SkeletonSet key={p.kind} loaded={arrived > i} skeleton="product" className={i === 2 ? "hidden min-w-0 sm:block" : "min-w-0"}>
              <article className="overflow-hidden rounded-md border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
                <ProductArt kind={p.kind} />
                <div className="p-4">
                  <p className="truncate text-sm font-medium">{productNames[p.kind]}</p>
                  <p className="truncate text-xs text-current/60">{p.detail}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-semibold tracking-tight tabular-nums">{p.price}</span>
                    <button
                      type="button"
                      className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </article>
            </SkeletonSet>
          ))}
        </div>
      </section>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="mb-3 text-base font-semibold tracking-tight">
          Recent orders
        </h2>
        <SkeletonSet loaded={arrived > 3} skeleton="list" count={3}>
          <ul className="divide-y divide-dashed divide-[#e7e0d0] rounded-md border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] dark:divide-[#38332b] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
            {orders.map((o) => (
              <li key={o.no} className="flex items-center gap-3 px-4 py-3.5">
                <ProductArt kind={o.kind} className="size-10 shrink-0 rounded-[3px]" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium tracking-[0.12em]">{o.no}</p>
                  <p className="text-xs text-current/60">
                    {o.date} · {o.status}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">{o.total}</span>
              </li>
            ))}
          </ul>
        </SkeletonSet>
      </section>
    </div>
  );
}
