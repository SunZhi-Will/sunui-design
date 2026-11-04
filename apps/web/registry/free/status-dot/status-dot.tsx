"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 中性色系 app（Schedary、usermeld、spliteat、ComfyUI）共用的狀態色，淺色與深色各一組
const STATUS_TOKENS =
  "[--db-success:#15803D] [--db-warning:#B45309] [--db-danger:#DC2626] [--db-info:#4F46E5] dark:[--db-success:#4ADE80] dark:[--db-warning:#FBBF24] dark:[--db-danger:#F87171] dark:[--db-info:#818CF8]";

/* ──────────────────────────────────────────────────────────────
 * StatusDot（ComfyUI status-dot）
 * ────────────────────────────────────────────────────────────── */

export type StatusTone = "success" | "warning" | "destructive" | "muted" | "info";

const DOT: Record<StatusTone, string> = {
  success: "bg-(--db-success)",
  warning: "bg-(--db-warning)",
  destructive: "bg-(--db-danger)",
  muted: "bg-muted-foreground",
  info: "bg-(--db-info)",
};

/**
 * 全站統一的狀態標示：小圓點加文字。
 * 顏色只放在圓點上，文字維持一般字色，一整排狀態不會變成彩虹。
 */
export function StatusDot({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn(STATUS_TOKENS, "inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}
