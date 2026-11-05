"use client";

import { useEffect, useState } from "react";

import { ProductArt, type ProductKind } from "@/registry/_demo/product-art";

import { SkeletonSet } from "./skeleton-set";

const orders: { kind: ProductKind; no: string; meta: string; total: string }[] = [
  { kind: "sneaker", no: "SU-24817", meta: "Oct 28 · Delivered", total: "$88.00" },
  { kind: "mug", no: "SU-24602", meta: "Oct 14 · Delivered", total: "$48.00" },
];

/** 型錄卡片：骨架列表在資料到達時交叉淡入真實內容，Replay 可重看。 */
export default function SkeletonSetCard() {
  const [loaded, setLoaded] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setLoaded(false);
    const t = window.setTimeout(() => setLoaded(true), 1400);
    return () => window.clearTimeout(t);
  }, [run]);

  return (
    <div className="mx-auto w-72 space-y-2.5">
      <SkeletonSet loaded={loaded} skeleton="list" count={2}>
        <ul className="divide-y divide-dashed divide-[#e7e0d0] rounded-md border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] dark:divide-[#38332b] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
          {orders.map((o) => (
            <li key={o.no} className="flex items-center gap-3 px-4 py-3.5">
              <ProductArt kind={o.kind} className="size-10 shrink-0 rounded-[3px]" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium tracking-[0.12em]">{o.no}</p>
                <p className="text-xs text-current/60">{o.meta}</p>
              </div>
              <span className="text-sm font-medium tabular-nums">{o.total}</span>
            </li>
          ))}
        </ul>
      </SkeletonSet>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="mx-auto block rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Replay
      </button>
    </div>
  );
}
