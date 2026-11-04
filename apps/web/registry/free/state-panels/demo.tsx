"use client";

import { useEffect, useRef, useState } from "react";

import { EmptyState, ErrorState, LoadingState, UsersIcon } from "./state-panels";

type Share = { name: string; amount: number };
type Bill = { id: string; title: string; date: string; total: number };

const exampleBill: Share[] = [
  { name: "Ava", amount: 210 },
  { name: "Ben", amount: 180 },
  { name: "Chloe", amount: 170 },
];

const history: Bill[] = [
  { id: "b-31", title: "Hotpot night", date: "Nov 2", total: 1840 },
  { id: "b-30", title: "Team lunch", date: "Oct 29", total: 960 },
  { id: "b-29", title: "Ramen after the match", date: "Oct 21", total: 720 },
];

const yuan = (n: number) => `$${n.toLocaleString("en-US")}`;

function Rows({ rows }: { rows: { key: string; left: string; sub?: string; right: string }[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
      {rows.map((r) => (
        <li key={r.key} className="flex min-w-0 items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{r.left}</span>
            {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
          </span>
          <span className="shrink-0 font-medium tabular-nums">{r.right}</span>
        </li>
      ))}
    </ul>
  );
}

export default function StatePanelsDemo() {
  const [bill, setBill] = useState<Share[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const tries = useRef(0);

  // 帳單紀錄：第一次載入逾時，重試後成功
  useEffect(() => {
    if (status !== "loading") return;
    const id = setTimeout(() => {
      tries.current += 1;
      setStatus(tries.current < 2 ? "error" : "ready");
    }, 1400);
    return () => clearTimeout(id);
  }, [status]);

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
      <section aria-labelledby="sp-bill" className="min-w-0 space-y-3">
        <h2 id="sp-bill" className="text-sm font-semibold">
          This bill
        </h2>
        {bill.length ? (
          <Rows rows={bill.map((s) => ({ key: s.name, left: s.name, right: yuan(s.amount) }))} />
        ) : (
          <EmptyState
            icon={<UsersIcon />}
            title="No bill yet"
            description="Start by adding people, or load a filled-in example to see how it works."
            onLoadExample={() => setBill(exampleBill)}
            secondary={{ label: "Add people", href: "#members" }}
          />
        )}
      </section>

      <section aria-labelledby="sp-history" className="min-w-0 space-y-3">
        <h2 id="sp-history" className="text-sm font-semibold">
          Past bills
        </h2>
        {status === "loading" ? (
          <LoadingState rows={3} label="Loading past bills" />
        ) : status === "error" ? (
          <ErrorState title="Couldn't load past bills" message="The connection timed out. Your bills are safe, please try again." onRetry={() => setStatus("loading")} />
        ) : (
          <Rows rows={history.map((b) => ({ key: b.id, left: b.title, sub: b.date, right: yuan(b.total) }))} />
        )}
      </section>
    </div>
  );
}
