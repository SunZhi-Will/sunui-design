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

/** 型錄卡片：一條分頁列，點頁碼或左右鍵，頁碼長度固定不跳動。 */
export default function PaginationCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [page, setPage] = useState(6);
  const pages = Math.ceil(TOTAL_ITEMS / PER_PAGE);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, TOTAL_ITEMS);

  return (
    <div className="mx-auto w-[300px] space-y-3">
      <p className="text-center text-xs text-muted-foreground tabular-nums">
        {t.range(from, to, TOTAL_ITEMS)}
      </p>
      {/* 卡片寬度有限，前後只留目前頁一格 */}
      <Pagination locale={locale} total={pages} page={page} onPageChange={setPage} siblings={0} />
    </div>
  );
}
