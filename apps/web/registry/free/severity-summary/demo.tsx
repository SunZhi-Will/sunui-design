"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { IssuesSummary, severityColors, type Severity } from "./severity-summary";

type Issue = { id: string; severity: Severity; title: string; file: string };

const issuesByLocale: { en: Issue[] } & Record<"zh-TW" | "zh-CN" | "ja", Issue[]> = {
  en: [
    { id: "sql", severity: "critical", title: "SQL query built from user input", file: "products.repository.ts" },
    { id: "n1", severity: "high", title: "N+1 queries when loading order items", file: "orders.service.ts" },
    { id: "cors", severity: "high", title: "CORS allows any origin", file: "server.ts" },
    { id: "any", severity: "medium", title: "Response typed as any", file: "useCheckout.ts" },
    { id: "dup", severity: "low", title: "Duplicated price formatting helper", file: "format.ts" },
  ],
  "zh-TW": [
    { id: "sql", severity: "critical", title: "SQL 查詢直接拼接使用者輸入", file: "products.repository.ts" },
    { id: "n1", severity: "high", title: "載入訂單項目時出現 N+1 查詢", file: "orders.service.ts" },
    { id: "cors", severity: "high", title: "CORS 允許任何來源", file: "server.ts" },
    { id: "any", severity: "medium", title: "回應型別是 any", file: "useCheckout.ts" },
    { id: "dup", severity: "low", title: "價格格式化函式重複了", file: "format.ts" },
  ],
  "zh-CN": [
    { id: "sql", severity: "critical", title: "SQL 查询直接拼接用户输入", file: "products.repository.ts" },
    { id: "n1", severity: "high", title: "加载订单条目时出现 N+1 查询", file: "orders.service.ts" },
    { id: "cors", severity: "high", title: "CORS 允许任意来源", file: "server.ts" },
    { id: "any", severity: "medium", title: "响应类型为 any", file: "useCheckout.ts" },
    { id: "dup", severity: "low", title: "价格格式化函数重复", file: "format.ts" },
  ],
  ja: [
    { id: "sql", severity: "critical", title: "ユーザー入力から SQL クエリを組み立てている", file: "products.repository.ts" },
    { id: "n1", severity: "high", title: "注文項目の読み込みで N+1 クエリが発生", file: "orders.service.ts" },
    { id: "cors", severity: "high", title: "CORS がすべてのオリジンを許可", file: "server.ts" },
    { id: "any", severity: "medium", title: "レスポンスの型が any", file: "useCheckout.ts" },
    { id: "dup", severity: "low", title: "価格フォーマット用ヘルパーが重複", file: "format.ts" },
  ],
};

export default function IssuesSummaryDemo() {
  const locale = useDemoLocale();
  const issues = useDemoText(issuesByLocale);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const summary = issues.reduce(
    (acc, i) => ((acc[i.severity] += 1), acc),
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>,
  );
  const shown = filter === "all" ? issues : issues.filter((i) => i.severity === filter);

  return (
    <div className="w-full min-w-0 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <IssuesSummary summary={summary} severityFilter={filter} onSeverityFilterChange={setFilter} locale={locale} />
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
