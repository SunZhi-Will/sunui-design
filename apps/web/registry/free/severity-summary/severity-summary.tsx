"use client";

import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

/* 嚴重程度配色（原本 tailwind.config 的 severity 色票） */

export const severityColors: Record<Severity, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

/* 文案 */

const defaultLabels = {
  issuesSummary: "Issues Summary",
  noIssuesFound: "No Issues Found",
  severity: { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" } as Record<Severity, string>,
};

export type IssuesSummaryLabels = Partial<typeof defaultLabels>;

/* 嚴重程度摘要（IssuesSummary）：只列 critical、high、medium，點一下篩選，再點取消 */

export interface IssuesSummaryProps {
  summary: Record<Severity, number>;
  severityFilter: Severity | "all";
  onSeverityFilterChange: (s: Severity | "all") => void;
  colors?: Record<Severity, string>;
  labels?: IssuesSummaryLabels;
}

export function IssuesSummary({ summary, severityFilter, onSeverityFilterChange, colors = severityColors, labels }: IssuesSummaryProps) {
  const t = { ...defaultLabels, ...labels };
  const important = ["critical", "high", "medium"] as const;
  const total = important.reduce((sum, s) => sum + summary[s], 0);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label={t.issuesSummary}>
      <span className="text-muted-foreground">{t.issuesSummary}:</span>
      {important.map((s) => {
        const count = summary[s];
        if (count === 0) return null;
        const active = severityFilter === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => onSeverityFilterChange(active ? "all" : s)}
            className={cn(
              "rounded border px-2 py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
              active ? "" : "border-transparent hover:opacity-80",
            )}
            style={active ? { color: colors[s], backgroundColor: `${colors[s]}1a`, borderColor: `${colors[s]}4d` } : { color: colors[s] }}
          >
            <span className="font-medium">{t.severity[s]}</span>
            <span className="ml-1 tabular-nums">{count}</span>
          </button>
        );
      })}
      {total === 0 && <span className="text-muted-foreground">{t.noIssuesFound}</span>}
    </div>
  );
}
