"use client";

import { useState } from "react";

import { Pagination } from "./pagination";

const PER_PAGE = 24;
const TOTAL_ITEMS = 286;

/** 型錄卡片：一條分頁列，點頁碼或左右鍵，頁碼長度固定不跳動。 */
export default function PaginationCard() {
  const [page, setPage] = useState(6);
  const pages = Math.ceil(TOTAL_ITEMS / PER_PAGE);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, TOTAL_ITEMS);

  return (
    <div className="mx-auto w-[300px] space-y-3">
      <p className="text-center text-xs text-muted-foreground tabular-nums">
        {from} to {to} of {TOTAL_ITEMS} items
      </p>
      {/* 卡片寬度有限，前後只留目前頁一格 */}
      <Pagination total={pages} page={page} onPageChange={setPage} siblings={0} />
    </div>
  );
}
