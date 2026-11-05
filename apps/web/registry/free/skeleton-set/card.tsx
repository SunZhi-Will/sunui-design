"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, type ProductKind } from "@/registry/_demo/product-art";

import { SkeletonSet } from "./skeleton-set";

const orders: { kind: ProductKind; no: string; month: number; day: number; total: string }[] = [
  { kind: "sneaker", no: "SU-24817", month: 10, day: 28, total: "$88.00" },
  { kind: "mug", no: "SU-24602", month: 10, day: 14, total: "$48.00" },
];

const copy = {
  en: { delivered: "Delivered", replay: "Replay" },
  "zh-TW": { delivered: "已送達", replay: "重播" },
  "zh-CN": { delivered: "已送达", replay: "重播" },
  ja: { delivered: "配達済み", replay: "もう一度" },
};

/** 型錄卡片：骨架列表在資料到達時交叉淡入真實內容，Replay 可重看。 */
export default function SkeletonSetCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const date = (m: number, d: number) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(2026, m - 1, d));
  const [loaded, setLoaded] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    setLoaded(false);
    const t = window.setTimeout(() => setLoaded(true), 1400);
    return () => window.clearTimeout(t);
  }, [run]);

  return (
    <div className="mx-auto w-72 space-y-2.5">
      <SkeletonSet loaded={loaded} skeleton="list" count={2} locale={locale}>
        <ul className="divide-y divide-dashed divide-[#e2e2e2] rounded-md border border-[#e2e2e2] bg-[#f7f7f7] text-[#171717] dark:divide-[#333333] dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]">
          {orders.map((o) => (
            <li key={o.no} className="flex items-center gap-3 px-4 py-3.5">
              <ProductArt kind={o.kind} className="size-10 shrink-0 rounded-[3px]" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium tracking-[0.12em]">{o.no}</p>
                <p className="text-xs text-current/60">{date(o.month, o.day)} · {t.delivered}</p>
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
        {t.replay}
      </button>
    </div>
  );
}
