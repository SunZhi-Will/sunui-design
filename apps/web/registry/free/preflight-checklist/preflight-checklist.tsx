"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CheckSeverity = "ok" | "warn" | "block";
export type PermissionStatus = "granted" | "denied" | "unknown";

export interface PreflightCheck {
  id: string;
  severity: CheckSeverity;
  message: ReactNode;
  fix?: { label: ReactNode; onClick: () => void };
}

export interface PreflightPermission {
  id: string;
  name: ReactNode;
  required?: boolean;
  status: PermissionStatus;
  onFix?: () => void;
}

export interface PreflightChecklistLabels {
  checksTitle?: ReactNode;
  permissionsTitle?: ReactNode;
  summaryReady?: ReactNode;
  summaryWarnings?: (n: number) => ReactNode;
  summaryBlocked?: (n: number) => ReactNode;
  blockedHint?: (first: ReactNode) => ReactNode;
  recheck?: ReactNode;
  checking?: ReactNode;
  required?: ReactNode;
  optional?: ReactNode;
  granted?: ReactNode;
  denied?: ReactNode;
  unknown?: ReactNode;
  grant?: ReactNode;
  fix?: ReactNode;
}

export interface PreflightChecklistProps {
  checks: PreflightCheck[];
  permissions?: PreflightPermission[];
  cta: { label: ReactNode; onClick: () => void };
  /** 重新檢查單一項目；不給 id 代表全部重跑 */
  onRecheck?: (id?: string) => Promise<void> | void;
  labels?: PreflightChecklistLabels;
  className?: string;
}

const defaultLabels: Required<PreflightChecklistLabels> = {
  checksTitle: "Checks",
  permissionsTitle: "Permissions",
  summaryReady: "Everything looks good",
  summaryWarnings: (n) => <>{n} {n === 1 ? "warning" : "warnings"}, nothing blocking</>,
  summaryBlocked: (n) => <>{n} {n === 1 ? "issue must" : "issues must"} be fixed first</>,
  blockedHint: (first) => <>Fix this first: {first}</>,
  recheck: "Check again",
  checking: "Checking",
  required: "Required",
  optional: "Optional",
  granted: "Allowed",
  denied: "Blocked",
  unknown: "Not asked yet",
  grant: "Allow",
  fix: "Fix",
};

const severityDot: Record<CheckSeverity, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  block: "bg-destructive",
};

const statusDot: Record<PermissionStatus, string> = {
  granted: "bg-emerald-500",
  denied: "bg-destructive",
  unknown: "bg-muted-foreground/50",
};

function Spinner({ reduce }: { reduce: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="size-3.5 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
    >
      <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
    </motion.svg>
  );
}

const rowButton =
  "h-7 shrink-0 rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function PreflightChecklist({ checks, permissions = [], cta, onRecheck, labels, className }: PreflightChecklistProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const [checking, setChecking] = useState<Set<string>>(new Set());

  const blockingChecks = checks.filter((c) => c.severity === "block");
  const blockingPerms = permissions.filter((p) => p.required && p.status !== "granted");
  const blockedCount = blockingChecks.length + blockingPerms.length;
  const warnCount = checks.filter((c) => c.severity === "warn").length;
  const firstBlock = blockingPerms[0]?.name ?? blockingChecks[0]?.message;

  const recheck = async (ids: string[]) => {
    setChecking((s) => new Set([...s, ...ids]));
    try {
      await onRecheck?.(ids.length === 1 ? ids[0] : undefined);
    } finally {
      setChecking((s) => {
        const next = new Set(s);
        ids.forEach((i) => next.delete(i));
        return next;
      });
    }
  };

  const summary = blockedCount ? t.summaryBlocked(blockedCount) : warnCount ? t.summaryWarnings(warnCount) : t.summaryReady;

  return (
    <section className={cn("w-full rounded-xl border border-border bg-card text-card-foreground", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium" role="status" aria-live="polite">
          <span
            aria-hidden="true"
            className={cn("size-1.5 rounded-full", blockedCount ? "bg-destructive" : warnCount ? "bg-amber-500" : "bg-emerald-500")}
          />
          {summary}
        </p>
        {onRecheck && (
          <button type="button" onClick={() => recheck(checks.map((c) => c.id))} className={rowButton}>
            {t.recheck}
          </button>
        )}
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_15rem]">
        <div className="divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.checksTitle}</p>
            <ul className="mt-2 space-y-1">
              {checks.map((c) => (
                <li key={c.id} className="flex min-h-9 items-center gap-3 text-sm">
                  {checking.has(c.id) ? (
                    <Spinner reduce={reduce} />
                  ) : (
                    <span aria-hidden="true" className={cn("mx-1 size-1.5 shrink-0 rounded-full", severityDot[c.severity])} />
                  )}
                  <span className="sr-only">{c.severity === "ok" ? "Passed:" : c.severity === "warn" ? "Warning:" : "Blocking:"}</span>
                  <span className={cn("min-w-0 flex-1", c.severity === "ok" && "text-muted-foreground")}>
                    {checking.has(c.id) ? t.checking : c.message}
                  </span>
                  {c.fix && c.severity !== "ok" && (
                    <button type="button" onClick={c.fix.onClick} className={rowButton}>
                      {c.fix.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {permissions.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.permissionsTitle}</p>
              <ul className="mt-2 space-y-1">
                {permissions.map((p) => (
                  <li key={p.id} className="flex min-h-9 items-center gap-3 text-sm">
                    <span aria-hidden="true" className={cn("mx-1 size-1.5 shrink-0 rounded-full", statusDot[p.status])} />
                    <span className="min-w-0 flex-1">
                      {p.name}
                      <span className="ml-2 text-xs text-muted-foreground">{p.required ? t.required : t.optional}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{t[p.status]}</span>
                    {p.status !== "granted" && p.onFix && (
                      <button type="button" onClick={p.onFix} className={rowButton}>
                        {p.status === "denied" ? t.fix : t.grant}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 主要動作放在檢查結果旁邊，而不是另開對話框 */}
        <div className="flex flex-col justify-end gap-2 border-t border-border p-4 md:border-t-0 md:border-l">
          <button
            type="button"
            onClick={cta.onClick}
            disabled={blockedCount > 0}
            aria-describedby={blockedCount ? `${id}-hint` : undefined}
            className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cta.label}
          </button>
          {blockedCount > 0 && (
            <p id={`${id}-hint`} className="text-xs text-muted-foreground">
              {t.blockedHint(firstBlock)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
