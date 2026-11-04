"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ReasonKind = "ok" | "warn" | "conflict";
export type Decision = "accepted" | "rejected";

export interface ExplainReason {
  kind: ReasonKind;
  text: ReactNode;
}

export interface ExplainSuggestion {
  id: string;
  title: ReactNode;
  /** 改動發生在哪裡，例如商品或欄位 */
  where?: ReactNode;
  reasons: ExplainReason[];
  /** 0 到 1 */
  confidence?: number;
  impact?: ReactNode;
  /** 可以被「接受安全項」一次接受 */
  safe?: boolean;
  /** 必須逐一檢查；填入原因字串會顯示出來 */
  needsReview?: boolean | string;
}

export interface ExplainCandidate {
  id: string;
  name: ReactNode;
  label?: ReactNode;
  tone?: "recommended" | "neutral" | "caution";
  reasons?: ExplainReason[];
}

export interface ExplainPanelLabels {
  accepted?: (n: number, total: number) => ReactNode;
  acceptSafe?: ReactNode;
  rejectAll?: ReactNode;
  accept?: ReactNode;
  reject?: ReactNode;
  undo?: ReactNode;
  acceptedReceipt?: ReactNode;
  rejectedReceipt?: ReactNode;
  confidence?: ReactNode;
  needsReview?: ReactNode;
  pick?: ReactNode;
  candidatesTitle?: ReactNode;
}

export interface ExplainPanelProps {
  suggestions: ExplainSuggestion[];
  value?: Record<string, Decision>;
  defaultValue?: Record<string, Decision>;
  onDecisionsChange?: (decisions: Record<string, Decision>) => void;
  /** 替補名單（例如排班的候選人） */
  candidates?: ExplainCandidate[];
  onPick?: (id: string) => void;
  labels?: ExplainPanelLabels;
  className?: string;
}

const defaultLabels: Required<ExplainPanelLabels> = {
  accepted: (n, total) => <>{n} of {total} accepted</>,
  acceptSafe: "Accept safe ones",
  rejectAll: "Reject all",
  accept: "Accept",
  reject: "Reject",
  undo: "Undo",
  acceptedReceipt: "Accepted",
  rejectedReceipt: "Rejected",
  confidence: "Confidence",
  needsReview: "Review this one yourself; it can't be accepted in bulk.",
  pick: "Pick",
  candidatesTitle: "Other candidates",
};

const ease = [0.23, 1, 0.32, 1] as const;

const reasonGlyph: Record<ReasonKind, { mark: string; className: string; sr: string }> = {
  ok: { mark: "✓", className: "text-emerald-600 dark:text-emerald-400", sr: "Met:" },
  warn: { mark: "△", className: "text-amber-600 dark:text-amber-400", sr: "Caveat:" },
  conflict: { mark: "✕", className: "text-destructive", sr: "Conflict:" },
};

const toneDot = { recommended: "bg-emerald-500", neutral: "bg-muted-foreground/50", caution: "bg-amber-500" };

function Reasons({ reasons }: { reasons: ExplainReason[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {reasons.map((r, i) => {
        const g = reasonGlyph[r.kind];
        return (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className={cn("w-4 shrink-0 text-center text-xs leading-5", g.className)}>
              {g.mark}
            </span>
            <span className="sr-only">{g.sr}</span>
            <span className="text-muted-foreground">{r.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ExplainPanel({
  suggestions,
  value,
  defaultValue,
  onDecisionsChange,
  candidates,
  onPick,
  labels,
  className,
}: ExplainPanelProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const [inner, setInner] = useState<Record<string, Decision>>(defaultValue ?? {});
  const decisions = value ?? inner;
  const [announce, setAnnounce] = useState("");

  const commit = (next: Record<string, Decision>, message: string) => {
    if (value === undefined) setInner(next);
    onDecisionsChange?.(next);
    setAnnounce(message);
  };

  const decide = (id: string, d: Decision | null) => {
    const next = { ...decisions };
    if (d) next[id] = d;
    else delete next[id];
    commit(next, d ? `${d === "accepted" ? "Accepted" : "Rejected"} suggestion` : "Decision undone");
  };

  const pending = suggestions.filter((s) => !decisions[s.id]);
  const safePending = pending.filter((s) => s.safe && !s.needsReview);
  const acceptedCount = suggestions.filter((s) => decisions[s.id] === "accepted").length;

  const bulk = (list: ExplainSuggestion[], d: Decision) => {
    const next = { ...decisions };
    list.forEach((s) => (next[s.id] = d));
    commit(next, `${list.length} suggestions ${d}`);
  };

  const transition = reduce ? { duration: 0 } : { duration: 0.24, ease };

  return (
    <section className={cn("w-full space-y-3 text-foreground", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium tabular-nums">{t.accepted(acceptedCount, suggestions.length)}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!safePending.length}
            onClick={() => bulk(safePending, "accepted")}
            className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
          >
            {t.acceptSafe}
            {safePending.length > 0 && <span className="ml-1.5 tabular-nums opacity-80">{safePending.length}</span>}
          </button>
          <button
            type="button"
            disabled={!pending.length}
            onClick={() => bulk(pending, "rejected")}
            className="h-8 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
          >
            {t.rejectAll}
          </button>
        </div>
      </header>

      <ul className="space-y-2">
        {suggestions.map((s) => {
          const d = decisions[s.id];
          return (
            <motion.li key={s.id} layout={!reduce} transition={transition} className="overflow-hidden rounded-xl border border-border bg-card">
              <AnimatePresence initial={false} mode="popLayout">
                {d ? (
                  <motion.div
                    key="receipt"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-1.5 shrink-0 rounded-full", d === "accepted" ? "bg-emerald-500" : "bg-muted-foreground/50")}
                    />
                    <span className="text-muted-foreground">{d === "accepted" ? t.acceptedReceipt : t.rejectedReceipt}</span>
                    <span className={cn("min-w-0 flex-1 truncate", d === "rejected" && "text-muted-foreground line-through")}>{s.title}</span>
                    <button
                      type="button"
                      onClick={() => decide(s.id, null)}
                      className="shrink-0 text-sm font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {t.undo}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="card"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    className="space-y-3 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="font-medium">{s.title}</p>
                        {s.where && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{s.where}</p>}
                      </div>
                      {s.confidence !== undefined && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t.confidence}</span>
                          <span aria-hidden="true" className="relative h-1 w-12 overflow-hidden rounded-full bg-muted">
                            <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${Math.round(s.confidence * 100)}%` }} />
                          </span>
                          <span className="font-medium text-foreground tabular-nums">{Math.round(s.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                    <Reasons reasons={s.reasons} />
                    {s.impact && <p className="text-sm">{s.impact}</p>}
                    {s.needsReview && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
                        {typeof s.needsReview === "string" ? s.needsReview : t.needsReview}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => decide(s.id, "accepted")}
                        className="h-8 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {t.accept}
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(s.id, "rejected")}
                        className="h-8 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {t.reject}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>

      {candidates && candidates.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <p className="border-b border-border px-4 py-2.5 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t.candidatesTitle}
          </p>
          <ul className="divide-y divide-border">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                <span aria-hidden="true" className={cn("mt-2 size-1.5 shrink-0 rounded-full", toneDot[c.tone ?? "neutral"])} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-medium">
                    {c.name}
                    {c.label && <span className="ml-2 text-xs font-normal text-muted-foreground">{c.label}</span>}
                  </p>
                  {c.reasons && <Reasons reasons={c.reasons} />}
                </div>
                <button
                  type="button"
                  onClick={() => onPick?.(c.id)}
                  className="h-8 shrink-0 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {t.pick}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </section>
  );
}
