"use client";

import { useState } from "react";

import { Pagination } from "./pagination";

const PER_PAGE = 24;
const TOTAL_ITEMS = 286;

export default function PaginationDemo() {
  const [page, setPage] = useState(6);
  const pages = Math.ceil(TOTAL_ITEMS / PER_PAGE);
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, TOTAL_ITEMS);

  return (
    <div className="w-full max-w-2xl space-y-4">
      <section className="rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight">Home and living</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {from} to {to} of {TOTAL_ITEMS} items
          </p>
        </div>
        <Pagination total={pages} page={page} onPageChange={setPage} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
          <p className="mb-3 text-sm font-semibold tracking-tight">Order history</p>
          <Pagination total={4} defaultPage={1} getHref={(n) => `#orders-page-${n}`} />
        </section>
        <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
          <p className="mb-3 text-sm font-semibold tracking-tight">Customer reviews</p>
          <Pagination total={38} defaultPage={3} compact />
        </section>
      </div>
    </div>
  );
}
