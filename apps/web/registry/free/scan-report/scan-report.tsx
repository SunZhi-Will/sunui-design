"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ScanFix {
  steps?: ReactNode[];
  before?: string;
  after?: string;
  difficulty?: "easy" | "medium" | "hard";
  eta?: ReactNode;
  autoFixable?: boolean;
}

export interface ScanIssue {
  id: string;
  severity: Severity;
  title: ReactNode;
  /** 例如 app/product/page.tsx:42 */
  location?: string;
  excerpt?: { startLine: number; lines: string[]; highlight?: [number, number] };
  fix?: ScanFix;
}

export interface ScanReportLabels {
  score?: ReactNode;
  severities?: Partial<Record<Severity, ReactNode>>;
  issues?: (n: number) => ReactNode;
  details?: ReactNode;
  hide?: ReactNode;
  fix?: ReactNode;
  autoFixable?: ReactNode;
  difficulty?: (d: string) => ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  copy?: ReactNode;
  copied?: ReactNode;
  empty?: ReactNode;
}

export interface ScanReportProps {
  score: number;
  scoreReason?: ReactNode;
  issues: ScanIssue[];
  filter?: Severity[];
  defaultFilter?: Severity[];
  onFilterChange?: (filter: Severity[]) => void;
  labels?: ScanReportLabels;
  className?: string;
}

const order: Severity[] = ["critical", "high", "medium", "low", "info"];

const defaultLabels = {
  score: "Health score",
  severities: { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" } as Record<Severity, ReactNode>,
  issues: (n: number) => <>{n} {n === 1 ? "issue" : "issues"}</>,
  details: "Details",
  hide: "Hide",
  fix: "Suggested fix",
  autoFixable: "Auto-fixable",
  difficulty: (d: string) => <>{d[0].toUpperCase() + d.slice(1)} fix</>,
  before: "Before",
  after: "After",
  copy: "Copy fix",
  copied: "Copied",
  empty: "No issues match this filter.",
};

const dot: Record<Severity, string> = {
  critical: "bg-destructive",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
  info: "bg-muted-foreground/50",
};

const ease = [0.23, 1, 0.32, 1] as const;

function scoreTone(score: number) {
  return score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-destructive";
}

function IssueCard({ issue, t, reduce }: { issue: ScanIssue; t: typeof defaultLabels; reduce: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelId = `scan-${issue.id}`;
  const { excerpt, fix } = issue;

  const copy = async () => {
    if (!fix?.after) return;
    try {
      await navigator.clipboard.writeText(fix.after);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 p-4">
        <span aria-hidden="true" className={cn("mt-2 size-1.5 shrink-0 rounded-full", dot[issue.severity])} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            <span className="sr-only">{t.severities[issue.severity]}: </span>
            {issue.title}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <span>{t.severities[issue.severity]}</span>
            {issue.location && <span className="truncate font-mono">{issue.location}</span>}
            {fix?.autoFixable && <span className="rounded-md border border-border px-1.5 text-foreground">{t.autoFixable}</span>}
          </p>
        </div>
        {(excerpt || fix) && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="h-7 shrink-0 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {open ? t.hide : t.details}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border p-4">
              {excerpt && (
                <pre className="overflow-x-auto rounded-md border border-border bg-background py-2 font-mono text-xs leading-5">
                  {excerpt.lines.map((line, i) => {
                    const n = excerpt.startLine + i;
                    const hit = excerpt.highlight && n >= excerpt.highlight[0] && n <= excerpt.highlight[1];
                    return (
                      <div key={n} className={cn("flex pr-3", hit && "bg-muted")}>
                        <span className="w-10 shrink-0 pr-3 text-right text-muted-foreground tabular-nums select-none">{n}</span>
                        <span className="whitespace-pre">{line}</span>
                      </div>
                    );
                  })}
                </pre>
              )}
              {fix && (
                <div className="space-y-2">
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="text-[11px] font-medium tracking-[0.14em] uppercase">{t.fix}</span>
                    {fix.difficulty && <span>{t.difficulty(fix.difficulty)}</span>}
                    {fix.eta && <span className="tabular-nums">{fix.eta}</span>}
                  </p>
                  {fix.steps && (
                    <ol className="list-decimal space-y-1 pl-5 text-sm">
                      {fix.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  )}
                  {(fix.before || fix.after) && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([["before", fix.before], ["after", fix.after]] as const).map(([k, code]) =>
                        code ? (
                          <div key={k} className="min-w-0 rounded-md border border-border bg-background">
                            <p className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
                              <span>{k === "before" ? t.before : t.after}</span>
                              {k === "after" && (
                                <button type="button" onClick={copy} className="font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none">
                                  {copied ? t.copied : t.copy}
                                </button>
                              )}
                            </p>
                            <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 whitespace-pre">{code}</pre>
                          </div>
                        ) : null,
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function ScanReport({ score, scoreReason, issues, filter, defaultFilter, onFilterChange, labels, className }: ScanReportProps) {
  const t = { ...defaultLabels, ...labels, severities: { ...defaultLabels.severities, ...labels?.severities } } as typeof defaultLabels;
  const reduce = useReducedMotion() ?? false;
  const [inner, setInner] = useState<Severity[]>(defaultFilter ?? []);
  const active = filter ?? inner;

  const toggle = (s: Severity) => {
    const next = active.includes(s) ? active.filter((x) => x !== s) : [...active, s];
    if (filter === undefined) setInner(next);
    onFilterChange?.(next);
  };

  const counts = order.map((s) => [s, issues.filter((i) => i.severity === s).length] as const);
  const shown = (active.length ? issues.filter((i) => active.includes(i.severity)) : issues)
    .slice()
    .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <section className={cn("w-full space-y-4 text-foreground", className)}>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold tabular-nums">{clamped}</span>
          <span className="text-sm text-muted-foreground tabular-nums">/100</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", scoreTone(clamped))} />
            {t.score}
          </p>
          {scoreReason && <p className="mt-0.5 text-sm text-muted-foreground">{scoreReason}</p>}
        </div>
      </div>

      <div role="group" aria-label="Filter by severity" className="flex flex-wrap gap-2">
        {counts.map(([s, n]) => (
          <button
            key={s}
            type="button"
            aria-pressed={active.includes(s)}
            disabled={!n}
            onClick={() => toggle(s)}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40 aria-pressed:border-foreground aria-pressed:bg-muted"
          >
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot[s])} />
            {t.severities[s]}
            <span className="text-muted-foreground tabular-nums">{n}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t.issues(shown.length)}
      </p>

      {shown.length ? (
        <ul className="space-y-2">
          {shown.map((issue) => (
            <IssueCard key={issue.id} issue={issue} t={t} reduce={reduce} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.empty}</p>
      )}
    </section>
  );
}
