"use client";

import { useState } from "react";

import { IssuesSummary, severityColors, type Severity } from "./severity-summary";

const issues: { id: string; severity: Severity; title: string }[] = [
  { id: "sql", severity: "critical", title: "SQL query built from user input" },
  { id: "n1", severity: "high", title: "N+1 queries when loading items" },
  { id: "cors", severity: "high", title: "CORS allows any origin" },
  { id: "any", severity: "medium", title: "Response typed as any" },
];

/** 型錄卡片：點嚴重程度標籤篩選問題清單，再點一次取消。 */
export default function SeveritySummaryCard() {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const summary = issues.reduce(
    (acc, i) => ((acc[i.severity] += 1), acc),
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>,
  );
  const shown = filter === "all" ? issues : issues.filter((i) => i.severity === filter);

  return (
    <div className="mx-auto w-72 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <IssuesSummary summary={summary} severityFilter={filter} onSeverityFilterChange={setFilter} labels={{ issuesSummary: "Issues" }} />
      <ul className="space-y-1.5" aria-live="polite">
        {shown.map((i) => (
          <li key={i.id} className="flex min-w-0 items-center gap-2.5 rounded border border-border px-2.5 py-1.5 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: severityColors[i.severity] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-foreground">{i.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
