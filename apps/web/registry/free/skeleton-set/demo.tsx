"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { SkeletonSet } from "./skeleton-set";

export const picks: { kind: ProductKind; price: string }[] = [
  { kind: "bottle", price: "$32" },
  { kind: "lamp", price: "$96" },
  { kind: "watch", price: "$185" },
];

const orders: { kind: ProductKind; no: string; month: number; day: number; returned?: boolean; total: string }[] = [
  { kind: "sneaker", no: "SU-24817", month: 10, day: 28, total: "$88.00" },
  { kind: "mug", no: "SU-24602", month: 10, day: 14, total: "$48.00" },
  { kind: "tote", no: "SU-24391", month: 9, day: 30, returned: true, total: "$36.00" },
];

export const copy = {
  en: { tracking: "Tracking SU-24817", trackingLabel: "Loading tracking updates", events: ["Delivered to front desk", "Out for delivery", "Arrived at local hub"], picks: "Picked for you", orders: "Recent orders", add: "Add", delivered: "Delivered", returned: "Returned", details: { bottle: "Brushed steel", lamp: "Powder-coated, warm white", watch: "Canvas strap" } as Record<string, string> },
  "zh-TW": { tracking: "物流追蹤 SU-24817", trackingLabel: "正在載入物流進度", events: ["已送達管理室", "配送中", "已抵達轉運站"], picks: "為你精選", orders: "近期訂單", add: "加入", delivered: "已送達", returned: "已退貨", details: { bottle: "髮絲紋不鏽鋼", lamp: "粉體烤漆，暖白光", watch: "帆布錶帶" } },
  "zh-CN": { tracking: "物流跟踪 SU-24817", trackingLabel: "正在加载物流进度", events: ["已送达前台", "派送中", "已到达转运中心"], picks: "为你精选", orders: "最近订单", add: "加购", delivered: "已送达", returned: "已退货", details: { bottle: "拉丝不锈钢", lamp: "粉末喷涂，暖白光", watch: "帆布表带" } },
  ja: { tracking: "配送状況 SU-24817", trackingLabel: "配送状況を読み込み中", events: ["受付に配達しました", "配達中", "最寄りの拠点に到着"], picks: "あなたへのおすすめ", orders: "最近の注文", add: "追加", delivered: "配達済み", returned: "返品済み", details: { bottle: "ヘアライン仕上げのスチール", lamp: "粉体塗装、電球色", watch: "キャンバスストラップ" } },
};

/** 每區塊的資料到達時間不同，像真實頁面陸續載入；工具列的 Replay 會重來一次 */
const ARRIVAL = [900, 1500, 2100, 2700, 3300];

/** 物流事件的時間（10 月 28 日） */
const EVENT_TIMES = [[14, 32], [9, 5], [6, 48]];

/** 日期格式化跟著 demo 語系 */
function useDate() {
  const locale = useDemoLocale();
  return {
    locale,
    date: (m: number, d: number) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(2026, m - 1, d)),
  };
}

/** 載入後的商品卡；首頁型錄的 variants.tsx 也用這三段真實內容 */
export function ProductPick({ kind, price }: { kind: ProductKind; price: string }) {
  const t = useDemoText(copy);
  const names = useProductNames();
  return (
    <article className="overflow-hidden rounded-md border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
      <ProductArt kind={kind} />
      <div className="p-4">
        <p className="truncate text-sm font-medium">{names[kind]}</p>
        <p className="truncate text-xs text-current/60">{t.details[kind]}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-semibold tracking-tight tabular-nums">{price}</span>
          <button
            type="button"
            className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t.add}
          </button>
        </div>
      </div>
    </article>
  );
}

export function OrderList() {
  const t = useDemoText(copy);
  const { date } = useDate();
  return (
    <ul className="divide-y divide-dashed divide-[#e7e0d0] rounded-md border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] dark:divide-[#38332b] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
      {orders.map((o) => (
        <li key={o.no} className="flex items-center gap-3 px-4 py-3.5">
          <ProductArt kind={o.kind} className="size-10 shrink-0 rounded-[3px]" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium tracking-[0.12em]">{o.no}</p>
            <p className="text-xs text-current/60">
              {date(o.month, o.day)} · {o.returned ? t.returned : t.delivered}
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums">{o.total}</span>
        </li>
      ))}
    </ul>
  );
}

export function TrackingList() {
  const t = useDemoText(copy);
  const { locale, date } = useDate();
  return (
    <ol className="flex flex-col gap-3">
      {t.events.map((e, i) => (
        <li
          key={e}
          className="flex h-11 items-center justify-between gap-3 rounded-md border border-[#e7e0d0] bg-[#faf7f0] px-4 text-sm text-[#1c1917] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]"
        >
          <span className={i === 0 ? "truncate font-medium" : "truncate text-current/70"}>{e}</span>
          <span className="shrink-0 text-xs text-current/60 tabular-nums">
            {date(10, 28)} {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(2026, 9, 28, EVENT_TIMES[i][0], EVENT_TIMES[i][1]))}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function SkeletonSetDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [arrived, setArrived] = useState(0);

  useEffect(() => {
    const timers = ARRIVAL.map((ms, i) => window.setTimeout(() => setArrived(i + 1), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div className="w-full max-w-3xl space-y-8 text-foreground">
      <section aria-labelledby="picks-heading">
        <h2 id="picks-heading" className="mb-3 text-base font-semibold tracking-tight">
          {t.picks}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {picks.map((p, i) => (
            <SkeletonSet key={p.kind} loaded={arrived > i} skeleton="product" locale={locale} className={i === 2 ? "hidden min-w-0 sm:block" : "min-w-0"}>
              <ProductPick kind={p.kind} price={p.price} />
            </SkeletonSet>
          ))}
        </div>
      </section>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="mb-3 text-base font-semibold tracking-tight">
          {t.orders}
        </h2>
        <SkeletonSet loaded={arrived > 3} skeleton="list" count={3} locale={locale}>
          <OrderList />
        </SkeletonSet>
      </section>

      <section aria-labelledby="tracking-heading">
        <h2 id="tracking-heading" className="mb-3 text-base font-semibold tracking-tight">
          {t.tracking}
        </h2>
        {/* 不確定會有幾筆時，用通用的 rows 預設 */}
        <SkeletonSet loaded={arrived > 4} skeleton="rows" count={3} label={t.trackingLabel} locale={locale}>
          <TrackingList />
        </SkeletonSet>
      </section>
    </div>
  );
}
