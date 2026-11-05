"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Pagination } from "./pagination";

const PER_PAGE = 24;
const TOTAL_ITEMS = 286;

const copy = {
  en: { range: (a: number, b: number, n: number) => `${a} to ${b} of ${n} items`, home: "Home and living", orders: "Order history", reviews: "Customer reviews" },
  "zh-TW": { range: (a: number, b: number, n: number) => `第 ${a} 至 ${b} 項，共 ${n} 項`, home: "居家生活", orders: "訂單紀錄", reviews: "顧客評價" },
  "zh-CN": { range: (a: number, b: number, n: number) => `第 ${a} 至 ${b} 项，共 ${n} 项`, home: "家居生活", orders: "订单记录", reviews: "用户评价" },
  ja: { range: (a: number, b: number, n: number) => `全 ${n} 件中 ${a}〜${b} 件`, home: "ホーム & リビング", orders: "注文履歴", reviews: "カスタマーレビュー" },
};

export default function PaginationDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [page, setPage] = useState(6);
  const pages = Math.ceil(TOTAL_ITEMS / PER_PAGE);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, TOTAL_ITEMS);

  return (
    <div className="w-full max-w-2xl space-y-4">
      <section className="rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight">{t.home}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {t.range(from, to, TOTAL_ITEMS)}
          </p>
        </div>
        <Pagination locale={locale} total={pages} page={page} onPageChange={setPage} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
          <p className="mb-3 text-sm font-semibold tracking-tight">{t.orders}</p>
          <Pagination locale={locale} total={4} defaultPage={1} getHref={(n) => `#orders-page-${n}`} />
        </section>
        <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
          <p className="mb-3 text-sm font-semibold tracking-tight">{t.reviews}</p>
          <Pagination locale={locale} total={38} defaultPage={3} compact />
        </section>
      </div>
    </div>
  );
}
