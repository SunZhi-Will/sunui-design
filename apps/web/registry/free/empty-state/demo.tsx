"use client";

import { useState } from "react";

import { EmptyState, UsersIcon } from "./empty-state";

type Share = { name: string; amount: number };

const exampleBill: Share[] = [
  { name: "Ava", amount: 210 },
  { name: "Ben", amount: 180 },
  { name: "Chloe", amount: 170 },
];

export default function EmptyStateDemo() {
  const [bill, setBill] = useState<Share[]>([]);

  return (
    <section aria-labelledby="es-bill" className="w-full max-w-md min-w-0 space-y-3">
      <h2 id="es-bill" className="text-sm font-semibold">
        This bill
      </h2>
      {bill.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
          {bill.map((s) => (
            <li key={s.name} className="flex min-w-0 items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
              <span className="shrink-0 font-medium tabular-nums">${s.amount}</span>
            </li>
          ))}
        </ul>
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
  );
}
