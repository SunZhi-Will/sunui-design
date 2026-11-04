"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* 型別（照原本的 scans/types.ts） */

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type IssueCategory = "security" | "performance" | "quality" | "maintainability";
export type IssueStatus = "open" | "resolved" | "false_positive" | "wont_fix";

export interface FixSuggestion {
  description: string;
  before: string;
  after: string;
  canAutoFix: boolean;
  difficulty: "easy" | "medium" | "hard";
  /** 預估分鐘數 */
  estimatedTime: number;
  steps?: { step: number; description: string; code?: string }[];
  reasoning?: string;
}

export interface ScanIssue {
  id: string;
  severity: Severity;
  category: IssueCategory;
  title: string;
  message: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  aiGenerated?: boolean;
  status: IssueStatus;
  fixSuggestion?: FixSuggestion | null;
  autoFixable?: boolean;
  codeSnippet?: string;
  /** 完整的程式碼上下文（原本從 GitHub 取回），有的話優先顯示 */
  codeContext?: { lines: string[]; startLineNumber: number } | null;
}

/* 嚴重程度配色（原本 tailwind.config 的 severity 色票） */

export const severityColors: Record<Severity, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

const severityStyle = (s: Severity, colors = severityColors): CSSProperties => ({
  color: colors[s],
  backgroundColor: `${colors[s]}1a`,
  borderColor: `${colors[s]}33`,
});

const categoryClass: Record<IssueCategory, string> = {
  security: "text-red-500 bg-red-500/10",
  performance: "text-yellow-500 bg-yellow-500/10",
  quality: "text-blue-500 bg-blue-500/10",
  maintainability: "text-purple-500 bg-purple-500/10",
};

const difficultyClass = {
  easy: "text-green-600 bg-green-50 border-green-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  hard: "text-red-600 bg-red-50 border-red-200",
};

/* 文案 */

const defaultLabels = {
  severity: { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" } as Record<Severity, string>,
  category: { security: "Security", performance: "Performance", quality: "Quality", maintainability: "Maintainability" } as Record<IssueCategory, string>,
  status: { open: "Open", resolved: "Resolved", false_positive: "False Positive", wont_fix: "Won't Fix" } as Record<IssueStatus, string>,
  aiGenerated: "AI Generated",
  viewCode: "View Code",
  hideCode: "Hide Code",
  markResolved: "Mark as Resolved",
  ignore: "Ignore",
  confirmIgnore: "Are you sure you want to ignore this issue?",
  fixSuggestion: "Fix Suggestion",
  autoFixable: "Auto Fixable",
  difficulty: { easy: "Easy", medium: "Medium", hard: "Hard" },
  minutes: (n: number) => `~${n} min`,
  fixReasoning: "Fix Reasoning",
  before: "Before",
  after: "After",
  copy: "Copy",
  copied: "Copied",
  fixSteps: "Fix Steps",
  autoFix: "Auto Fix",
  expand: "Show details",
  collapse: "Hide details",
  close: "Close",
  lines: (a: number, b: number) => `Lines ${a}-${b}`,
  noCodeSnippet: "No code snippet available for this issue.",
  highlighted: (a: number, b: number) => `Highlighted lines (${a}-${b}) indicate the problematic code`,
};

export type IssueCardLabels = Partial<typeof defaultLabels>;
type Labels = typeof defaultLabels;

/* 圖示（lucide 形狀） */

const I = {
  brain: (
    <>
      <path d="M12 18V5" />
      <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
      <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
      <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
      <path d="M18 18a4 4 0 0 0 2-7.464" />
      <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
      <path d="M6 18a4 4 0 0 1-2-7.464" />
      <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </>
  ),
  clock: (
    <>
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  zap: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m18 15-6-6-6 6" />,
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  check: (
    <>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </>
  ),
  code: (
    <>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
};

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cn("shrink-0", className)} aria-hidden="true">
      {children}
    </svg>
  );
}

/* 共用小元件（原本的 Badge、Button、Card） */

function Badge({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-medium transition-colors", className)} style={style}>
      {children}
    </span>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
const btnOutlineSm = cn(btnBase, "h-8 rounded-md border border-border bg-background px-3 text-xs shadow-sm hover:bg-accent hover:text-accent-foreground");
const btnGhostSm = cn(btnBase, "h-8 rounded-md px-3 text-xs hover:bg-accent hover:text-accent-foreground");

/* 修正建議（FixSuggestionCard） */

export function FixSuggestionCard({ fix, onAutoFix, labels }: { fix: FixSuggestion; onAutoFix?: () => void; labels?: IssueCardLabels }) {
  const t = { ...defaultLabels, ...labels };
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const handleCopy = (text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  const pane = (kind: "before" | "after", code: string) => (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border">
      <div className={cn("flex items-center justify-between border-b px-3 py-2", kind === "before" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50")}>
        <span className={cn("text-xs font-medium", kind === "before" ? "text-red-900" : "text-green-900")}>{kind === "before" ? t.before : t.after}</span>
        <button type="button" className={cn(btnGhostSm, "h-6 px-2 text-neutral-700 hover:bg-black/5")} onClick={() => handleCopy(code)} aria-label={copied ? t.copied : `${t.copy} ${kind === "before" ? t.before : t.after}`}>
          {copied ? (
            <Icon className="h-3 w-3 text-green-600">{I.check}</Icon>
          ) : (
            <Icon className="h-3 w-3">{I.copy}</Icon>
          )}
        </button>
      </div>
      <pre className={cn("overflow-x-auto p-3 text-xs text-neutral-900", kind === "before" ? "bg-red-50" : "bg-green-50")}>
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="mt-4 rounded-lg border border-l-4 border-border border-l-primary bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-2 p-6 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Icon className="h-5 w-5 text-primary">{I.lightbulb}</Icon>
            <h5 className="text-base leading-none font-semibold tracking-tight">{t.fixSuggestion}</h5>
            {fix.canAutoFix && (
              <Badge className="border-green-200 bg-green-50 text-green-600">
                <Icon className="mr-1 h-3 w-3">{I.zap}</Icon>
                {t.autoFixable}
              </Badge>
            )}
            <Badge className={difficultyClass[fix.difficulty]}>{t.difficulty[fix.difficulty]}</Badge>
            <Badge className="bg-secondary text-xs text-secondary-foreground">
              <Icon className="mr-1 h-3 w-3">{I.clock}</Icon>
              {t.minutes(fix.estimatedTime)}
            </Badge>
          </div>
          <button type="button" className={btnGhostSm} onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} aria-label={expanded ? t.collapse : t.expand}>
            <Icon className="h-4 w-4">{expanded ? I.chevronUp : I.chevronDown}</Icon>
          </button>
        </div>
      </div>
      <div className="space-y-4 p-6 pt-0">
        <p className="text-sm text-muted-foreground">{fix.description}</p>

        {fix.reasoning && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="mb-1 text-xs font-medium text-blue-900">{t.fixReasoning}</p>
            <p className="text-xs text-blue-800">{fix.reasoning}</p>
          </div>
        )}

        {expanded && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pane("before", fix.before)}
              {pane("after", fix.after)}
            </div>

            {fix.steps && fix.steps.length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary">{I.code}</Icon>
                  <h6 className="text-sm font-semibold">{t.fixSteps}</h6>
                </div>
                <ol className="space-y-2">
                  {fix.steps.map((step) => (
                    <li key={step.step} className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">{step.step}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{step.description}</p>
                        {step.code && (
                          <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                            <code>{step.code}</code>
                          </pre>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {fix.canAutoFix && onAutoFix && (
              <div className="flex justify-end">
                <button type="button" onClick={onAutoFix} className={cn(btnBase, "h-9 bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700")}>
                  <Icon className="mr-2 h-4 w-4">{I.zap}</Icon>
                  {t.autoFix}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* 程式碼檢視（CodeViewer）：問題行以黃色標示 */

function resolveCode(issue: ScanIssue): { lines: string[]; start: number } | null {
  if (issue.codeContext && issue.codeContext.lines.length > 0) return { lines: issue.codeContext.lines, start: issue.codeContext.startLineNumber };

  const snippetLines = issue.codeSnippet?.split("\n").filter((l) => l.trim()).length || 0;
  const hasFix = !!issue.fixSuggestion?.before && issue.fixSuggestion.before.trim().length > 0;
  let code: string;
  if (hasFix && (snippetLines < 5 || !issue.codeSnippet)) {
    code = issue.fixSuggestion!.before;
  } else if (issue.codeSnippet && snippetLines >= 5) code = issue.codeSnippet;
  else if (hasFix) {
    code = issue.fixSuggestion!.before;
  } else if (issue.codeSnippet) code = issue.codeSnippet;
  else return null;

  const lines = code.split("\n");
  // 不足 21 行時，以問題行為中心前後各補 10 行空白行號
  if (lines.length < 21) {
    const startLine = Math.max(1, issue.lineStart - 10);
    const endLine = issue.lineEnd + 10;
    const out: string[] = [];
    for (let n = startLine; n <= endLine; n++) {
      let rel: number;
      if (lines.length === 1) rel = n === issue.lineStart ? 0 : -1;
      else rel = n - (issue.lineStart - Math.floor((lines.length - 1) / 2));
      out.push(rel >= 0 && rel < lines.length ? lines[rel] || "" : "");
    }
    return { lines: out, start: startLine };
  }
  return { lines, start: Math.max(1, issue.lineStart - Math.floor(lines.length / 2)) };
}

export function CodeViewer({ issue, labels }: { issue: ScanIssue; labels?: IssueCardLabels }) {
  const t = { ...defaultLabels, ...labels };
  const code = resolveCode(issue);
  if (!code) return <p className="text-sm text-muted-foreground">{t.noCodeSnippet}</p>;
  return (
    <div className="relative">
      <div className="max-h-[60vh] overflow-hidden rounded-lg border border-border bg-muted">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full border-collapse">
            <tbody>
              {code.lines.map((line, i) => {
                const n = code.start + i;
                const problem = n >= issue.lineStart && n <= issue.lineEnd;
                const empty = !line || line.trim().length === 0;
                return (
                  <tr key={i} className={problem ? "bg-yellow-500/20" : ""}>
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-r border-border/30 bg-muted/50 py-0.5 pr-4 text-right font-mono text-xs select-none",
                        problem ? "font-semibold text-yellow-600" : "text-muted-foreground",
                      )}
                      style={{ minWidth: "3em", width: "3em" }}
                    >
                      {n}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-0.5 font-mono text-sm whitespace-pre",
                        problem ? "border-l-4 border-yellow-500 bg-yellow-500/10" : empty ? "text-muted-foreground/30" : "text-foreground",
                      )}
                    >
                      {empty ? <span className="select-none">·</span> : <code className="text-inherit">{line}</code>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        <span className="mr-2 inline-block h-3 w-3 rounded border border-yellow-500 bg-yellow-500/20 align-middle" aria-hidden="true" />
        {t.highlighted(issue.lineStart, issue.lineEnd)}
      </div>
    </div>
  );
}

/* 單一問題卡（IssueCard） */

export interface IssueCardProps {
  issue: ScanIssue;
  /** 回傳 Promise 時，期間按鈕會停用 */
  onStatusChange?: (id: string, status: IssueStatus) => void | Promise<void>;
  onAutoFix?: (id: string) => void;
  /** 「忽略」前的確認，預設用 window.confirm */
  confirmIgnore?: (issue: ScanIssue) => boolean | Promise<boolean>;
  colors?: Record<Severity, string>;
  /** true 時程式碼以全螢幕對話框開啟；false 時在卡片內展開 */
  fixed?: boolean;
  labels?: IssueCardLabels;
}

export function IssueCard({ issue, onStatusChange, onAutoFix, confirmIgnore, colors = severityColors, fixed = false, labels }: IssueCardProps) {
  const t: Labels = { ...defaultLabels, ...labels };
  const [showCode, setShowCode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const codeId = `scan-code-${issue.id}`;

  const updateStatus = async (status: "resolved" | "false_positive") => {
    if (updating || issue.status === status) return;
    if (status === "false_positive") {
      const ok = confirmIgnore ? await confirmIgnore(issue) : typeof window !== "undefined" && window.confirm(t.confirmIgnore);
      if (!ok) return;
    }
    try {
      setUpdating(true);
      await onStatusChange?.(issue.id, status);
    } finally {
      // 狀態更新後 500ms 才解除停用（照原本）
      setTimeout(() => setUpdating(false), 500);
    }
  };

  return (
    <div className="rounded border border-border p-4 transition-colors hover:border-primary/50 motion-reduce:transition-none">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge style={severityStyle(issue.severity, colors)}>{t.severity[issue.severity]}</Badge>
        <Badge className={cn("border-transparent", categoryClass[issue.category])}>{t.category[issue.category]}</Badge>
        {issue.aiGenerated && (
          <Badge className="border-purple-500/20 bg-purple-500/10 text-purple-500">
            <Icon className="mr-1 h-3 w-3">{I.brain}</Icon>
            {t.aiGenerated}
          </Badge>
        )}
        {issue.status !== "open" && <Badge className="bg-muted text-muted-foreground">{t.status[issue.status]}</Badge>}
      </div>
      <h4 className="mb-2 font-semibold text-foreground">{issue.title}</h4>
      <p className="mb-3 text-sm text-muted-foreground">{issue.message}</p>
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="min-w-0 font-mono break-all">{issue.filePath}</span>
        <span className="tabular-nums">
          {issue.lineStart}-{issue.lineEnd}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnOutlineSm} onClick={() => setShowCode((s) => !s)} disabled={updating} aria-expanded={fixed ? undefined : showCode} aria-controls={fixed ? undefined : codeId}>
          <Icon className="mr-1 h-4 w-4">{I.code}</Icon>
          {!fixed && showCode ? t.hideCode : t.viewCode}
        </button>
        <button type="button" className={btnOutlineSm} onClick={() => updateStatus("resolved")} disabled={updating || issue.status === "resolved"}>
          {t.markResolved}
        </button>
        <button type="button" className={btnOutlineSm} onClick={() => updateStatus("false_positive")} disabled={updating || issue.status === "false_positive"}>
          {t.ignore}
        </button>
      </div>

      {!fixed && showCode && (
        <div id={codeId} className="mt-4">
          <p className="mb-2 text-xs text-muted-foreground">
            {issue.filePath} ({t.lines(issue.lineStart, issue.lineEnd)})
          </p>
          <CodeViewer issue={issue} labels={labels} />
        </div>
      )}

      {issue.fixSuggestion && <FixSuggestionCard fix={issue.fixSuggestion} labels={labels} onAutoFix={issue.autoFixable && onAutoFix ? () => onAutoFix(issue.id) : undefined} />}

      {fixed && showCode && <CodeDialog issue={issue} t={t} labels={labels} onClose={() => setShowCode(false)} />}
    </div>
  );
}

function CodeDialog({ issue, t, labels, onClose }: { issue: ScanIssue; t: Labels; labels?: IssueCardLabels; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const titleId = `scan-code-title-${issue.id}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative z-50 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-2xl font-semibold">
              {t.viewCode}
            </h2>
            <p className="mt-1 text-sm break-all text-muted-foreground">
              {issue.filePath} ({t.lines(issue.lineStart, issue.lineEnd)})
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t.close} className={cn(btnBase, "h-6 w-6 hover:bg-accent")}>
            <Icon className="h-4 w-4">{I.x}</Icon>
          </button>
        </div>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="p-6">
            <CodeViewer issue={issue} labels={labels} />
          </div>
        </div>
      </div>
    </div>
  );
}
