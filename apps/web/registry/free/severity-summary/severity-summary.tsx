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

interface IssuesSummaryMessages {
  issuesSummary: string;
  noIssuesFound: string;
  severity: Record<Severity, string>;
  /** 小標後的冒號，中日文用全形 */
  colon: string;
}

export type IssuesSummaryLabels = Partial<IssuesSummaryMessages>;

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, IssuesSummaryMessages> = {
  en: {
    issuesSummary: "Issues Summary",
    noIssuesFound: "No Issues Found",
    severity: { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" },
    colon: ":",
  },
  "zh-TW": {
    issuesSummary: "問題摘要",
    noIssuesFound: "沒有發現問題",
    severity: { critical: "嚴重", high: "高", medium: "中", low: "低", info: "資訊" },
    colon: "：",
  },
  "zh-CN": {
    issuesSummary: "问题摘要",
    noIssuesFound: "未发现问题",
    severity: { critical: "严重", high: "高", medium: "中", low: "低", info: "信息" },
    colon: "：",
  },
  ja: {
    issuesSummary: "問題の概要",
    noIssuesFound: "問題は見つかりませんでした",
    severity: { critical: "重大", high: "高", medium: "中", low: "低", info: "情報" },
    colon: "：",
  },
};

/* 嚴重程度摘要（IssuesSummary）：只列 critical、high、medium，點一下篩選，再點取消 */

export interface IssuesSummaryProps {
  summary: Record<Severity, number>;
  severityFilter: Severity | "all";
  onSeverityFilterChange: (s: Severity | "all") => void;
  colors?: Record<Severity, string>;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: IssuesSummaryLabels;
}

export function IssuesSummary({ summary, severityFilter, onSeverityFilterChange, colors = severityColors, locale = "en", labels }: IssuesSummaryProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const important = ["critical", "high", "medium"] as const;
  const total = important.reduce((sum, s) => sum + summary[s], 0);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" role="group" aria-label={t.issuesSummary}>
      <span className="text-muted-foreground">{t.issuesSummary}{t.colon}</span>
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
