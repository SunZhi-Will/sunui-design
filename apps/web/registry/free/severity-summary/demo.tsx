"use client";

import { useState } from "react";

import { IssuesSummary, severityColors, type Severity } from "./severity-summary";

const issues: { id: string; severity: Severity; title: string; file: string }[] = [
  { id: "sql", severity: "critical", title: "SQL query built from user input", file: "products.repository.ts" },
  { id: "n1", severity: "high", title: "N+1 queries when loading order items", file: "orders.service.ts" },
  { id: "cors", severity: "high", title: "CORS allows any origin", file: "server.ts" },
  { id: "any", severity: "medium", title: "Response typed as any", file: "useCheckout.ts" },
  { id: "dup", severity: "low", title: "Duplicated price formatting helper", file: "format.ts" },
];

export default function IssuesSummaryDemo() {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const summary = issues.reduce(
    (acc, i) => ((acc[i.severity] += 1), acc),
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>,
  );
  const shown = filter === "all" ? issues : issues.filter((i) => i.severity === filter);

  return (
    <div className="w-full min-w-0 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <IssuesSummary summary={summary} severityFilter={filter} onSeverityFilterChange={setFilter} />
      <ul className="space-y-2" aria-live="polite">
        {shown.map((i) => (
          <li key={i.id} className="flex min-w-0 items-center gap-3 rounded border border-border px-3 py-2 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: severityColors[i.severity] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-foreground">{i.title}</span>
            <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">{i.file}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
