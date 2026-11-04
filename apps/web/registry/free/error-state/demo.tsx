"use client";

import { useState } from "react";

import { ErrorState } from "./error-state";

const history = [
  { id: "b-31", title: "Hotpot night", date: "Nov 2", total: 1840 },
  { id: "b-30", title: "Team lunch", date: "Oct 29", total: 960 },
  { id: "b-29", title: "Ramen after the match", date: "Oct 21", total: 720 },
];

export default function ErrorStateDemo() {
  const [failed, setFailed] = useState(true);

  return (
    <section aria-labelledby="er-history" className="w-full max-w-md min-w-0 space-y-3">
      <h2 id="er-history" className="text-sm font-semibold">
        Past bills
      </h2>
      {failed ? (
        <ErrorState title="Couldn't load past bills" message="The connection timed out. Your bills are safe, please try again." onRetry={() => setFailed(false)} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
          {history.map((b) => (
            <li key={b.id} className="flex min-w-0 items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{b.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{b.date}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">${b.total.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
