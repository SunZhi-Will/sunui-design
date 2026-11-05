"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { IssuesSummary, severityColors, type Severity } from "./severity-summary";

type Issue = { id: string; severity: Severity; title: string };

const issuesByLocale: { en: Issue[] } & Record<"zh-TW" | "zh-CN" | "ja", Issue[]> = {
  en: [
    { id: "sql", severity: "critical", title: "SQL query built from user input" },
    { id: "n1", severity: "high", title: "N+1 queries when loading items" },
    { id: "cors", severity: "high", title: "CORS allows any origin" },
    { id: "any", severity: "medium", title: "Response typed as any" },
  ],
  "zh-TW": [
    { id: "sql", severity: "critical", title: "SQL 查詢直接拼接使用者輸入" },
    { id: "n1", severity: "high", title: "載入項目時出現 N+1 查詢" },
    { id: "cors", severity: "high", title: "CORS 允許任何來源" },
    { id: "any", severity: "medium", title: "回應型別是 any" },
  ],
  "zh-CN": [
    { id: "sql", severity: "critical", title: "SQL 查询直接拼接用户输入" },
    { id: "n1", severity: "high", title: "加载条目时出现 N+1 查询" },
    { id: "cors", severity: "high", title: "CORS 允许任意来源" },
    { id: "any", severity: "medium", title: "响应类型为 any" },
  ],
  ja: [
    { id: "sql", severity: "critical", title: "ユーザー入力から SQL クエリを組み立てている" },
    { id: "n1", severity: "high", title: "項目の読み込みで N+1 クエリが発生" },
    { id: "cors", severity: "high", title: "CORS がすべてのオリジンを許可" },
    { id: "any", severity: "medium", title: "レスポンスの型が any" },
  ],
};

const copy = {
  en: { issues: "Issues" },
  "zh-TW": { issues: "問題" },
  "zh-CN": { issues: "问题" },
  ja: { issues: "問題" },
};

/** 型錄卡片：點嚴重程度標籤篩選問題清單，再點一次取消。 */
export default function SeveritySummaryCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const issues = useDemoText(issuesByLocale);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const summary = issues.reduce(
    (acc, i) => ((acc[i.severity] += 1), acc),
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>,
  );
  const shown = filter === "all" ? issues : issues.filter((i) => i.severity === filter);

  return (
    <div className="mx-auto w-72 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <IssuesSummary summary={summary} severityFilter={filter} onSeverityFilterChange={setFilter} locale={locale} labels={{ issuesSummary: t.issues }} />
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
