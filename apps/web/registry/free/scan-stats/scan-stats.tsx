"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* 文案 */

const defaultLabels = {
  issuesFound: "Issues Found",
  filesScanned: "Files Scanned",
  linesOfCode: "Lines of Code",
  scanType: "Scan Type",
  healthScore: "Health Score",
};

export type ScanStatsLabels = Partial<typeof defaultLabels>;

/* 共用小元件（原本的 Badge、Button、Card） */

function Badge({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-medium transition-colors", className)} style={style}>
      {children}
    </span>
  );
}

/* 統計卡（ScanStats） */

export interface ScanStatsProps {
  issuesFound: number;
  filesScanned?: number;
  linesOfCode?: number;
  scanType?: string;
  healthScore?: number | null;
  healthScoreReason?: string;
  labels?: ScanStatsLabels;
}

export function ScanStats({ issuesFound, filesScanned, linesOfCode, scanType, healthScore, healthScoreReason, labels }: ScanStatsProps) {
  const t = { ...defaultLabels, ...labels };
  const card = "min-w-0 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm";
  const label = "mb-1 text-sm text-muted-foreground";
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <div className={card}>
        <p className={label}>{t.issuesFound}</p>
        <p className="text-3xl font-semibold text-foreground tabular-nums">{issuesFound || 0}</p>
      </div>
      {filesScanned !== undefined && (
        <div className={card}>
          <p className={label}>{t.filesScanned}</p>
          <p className="text-3xl font-semibold text-foreground tabular-nums">{filesScanned}</p>
        </div>
      )}
      {linesOfCode !== undefined && (
        <div className={card}>
          <p className={label}>{t.linesOfCode}</p>
          <p className="text-3xl font-semibold text-foreground tabular-nums">{linesOfCode.toLocaleString("en-US")}</p>
        </div>
      )}
      {scanType && (
        <div className={card}>
          <p className={label}>{t.scanType}</p>
          <p className="text-lg font-semibold text-foreground capitalize">{scanType}</p>
        </div>
      )}
      {healthScore !== undefined && healthScore !== null && (
        <div className={card}>
          <p className={label}>{t.healthScore}</p>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "px-3 py-1 text-2xl font-bold tabular-nums",
                healthScore > 50 ? "bg-secondary text-foreground" : "bg-destructive text-white",
              )}
            >
              {healthScore}
            </Badge>
          </div>
          {healthScoreReason && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground" title={healthScoreReason}>
              {healthScoreReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
