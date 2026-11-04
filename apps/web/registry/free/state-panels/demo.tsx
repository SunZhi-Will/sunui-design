"use client";

import { useRef, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "./state-panels";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Row = { id: string; title: string; meta: string; amount: string };

const exampleReturns: Row[] = [
  { id: "RT-2041", title: "Linen shirt, size M", meta: "Refund to card, label sent", amount: "$58.00" },
  { id: "RT-2038", title: "Ceramic pour-over set", meta: "Exchange, arriving Thu", amount: "$42.00" },
];

const invoices: Row[] = [
  { id: "INV-8812", title: "Order SU-48213", meta: "Nov 3, 2026", amount: "$128.00" },
  { id: "INV-8790", title: "Order SU-48190", meta: "Oct 28, 2026", amount: "$64.50" },
];

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="divide-y divide-border rounded-md border border-border text-sm">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{r.title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              <span className="font-mono tracking-[0.12em]">{r.id}</span> · {r.meta}
            </span>
          </span>
          <span className="shrink-0 font-medium tabular-nums">{r.amount}</span>
        </li>
      ))}
    </ul>
  );
}

export default function StatePanelsDemo() {
  const [returns, setReturns] = useState<Row[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const attempts = useRef(0);

  // 第一次重試仍失敗，第二次成功
  async function retryInvoices() {
    attempts.current += 1;
    await wait(800);
    if (attempts.current < 2) throw new Error("timeout");
    setInvoicesLoaded(true);
  }

  return (
    <div className="grid w-full max-w-[60rem] gap-6 lg:grid-cols-3">
      <section aria-labelledby="returns-heading" className="space-y-3">
        <h2 id="returns-heading" className="text-sm font-semibold">
          Returns
        </h2>
        {returns.length ? (
          <Rows rows={returns} />
        ) : (
          <EmptyState
            title="No returns yet"
            description="When you send something back, you can track the refund here."
            action={{ label: "Start a return", href: "#" }}
            onLoadExample={() => setReturns(exampleReturns)}
          />
        )}
      </section>

      <section aria-labelledby="invoices-heading" className="space-y-3">
        <h2 id="invoices-heading" className="text-sm font-semibold">
          Invoices
        </h2>
        {invoicesLoaded ? (
          <Rows rows={invoices} />
        ) : (
          <ErrorState
            title="Invoices didn't load"
            detail={"GET /api/invoices 504 Gateway Timeout\nrequest-id: 7f3c9a12-b8e4"}
            onRetry={retryInvoices}
            support={{ label: "Contact support", href: "#" }}
          />
        )}
      </section>

      <section aria-labelledby="addresses-heading" className="space-y-3">
        <h2 id="addresses-heading" className="text-sm font-semibold">
          Saved addresses
        </h2>
        <LoadingState rows={3} media={false} slowAfter={3000} labels={{ loading: "Loading saved addresses" }} />
      </section>
    </div>
  );
}
