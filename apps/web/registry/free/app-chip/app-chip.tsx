"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 固定的識別色盤，只用在標籤前的小圓點。用 id 取餘數決定顏色，
// 同一個對象在不同畫面永遠是同一個顏色，整體畫面維持中性。
const PERSON_PALETTE = [
  { bg: "#DBEAFE", fg: "#2563EB", ring: "#93C5FD" }, // blue
  { bg: "#DCFCE7", fg: "#16A34A", ring: "#86EFAC" }, // green
  { bg: "#FEF3C7", fg: "#D97706", ring: "#FCD34D" }, // amber
  { bg: "#FCE7F3", fg: "#DB2777", ring: "#F9A8D4" }, // pink
  { bg: "#EDE9FE", fg: "#7C3AED", ring: "#C4B5FD" }, // violet
  { bg: "#CFFAFE", fg: "#0891B2", ring: "#67E8F9" }, // cyan
  { bg: "#FFE4E6", fg: "#E11D48", ring: "#FDA4AF" }, // rose
  { bg: "#ECFCCB", fg: "#65A30D", ring: "#BEF264" }, // lime
] as const;

function personColor(personId: number) {
  const idx = ((personId % PERSON_PALETTE.length) + PERSON_PALETTE.length) % PERSON_PALETTE.length;
  return PERSON_PALETTE[idx];
}

/** 字串 id 轉成穩定的整數，供 personColor 使用 */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** 專案的識別色，同一個專案在所有畫面永遠是同一個顏色 */
export function appColor(appId: string) {
  return personColor(hashId(appId));
}

// 中性色系 app（Schedary、usermeld、spliteat、ComfyUI）共用的狀態色，淺色與深色各一組
const STATUS_TOKENS =
  "[--db-success:#15803D] [--db-warning:#B45309] [--db-danger:#DC2626] [--db-info:#4F46E5] dark:[--db-success:#4ADE80] dark:[--db-warning:#FBBF24] dark:[--db-danger:#F87171] dark:[--db-info:#818CF8]";

/* ──────────────────────────────────────────────────────────────
 * AppDot、AppChip（usermeld app-chip）
 * ────────────────────────────────────────────────────────────── */

/** 專案的識別色圓點，顏色只出現在這個小圓點 */
export function AppDot({ appId, className }: { appId: string; className?: string }) {
  return (
    <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", className)} style={{ backgroundColor: appColor(appId).fg }} />
  );
}

/** 專案標籤：圓點加名稱，付費的帶「$」 */
export function AppChip({
  appId,
  name,
  paid,
  paidLabel = "Paid",
  className,
}: {
  appId: string;
  /** 顯示名稱，預設用 appId */
  name?: ReactNode;
  paid?: boolean;
  paidLabel?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        STATUS_TOKENS,
        "inline-flex h-6 max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium whitespace-nowrap text-foreground",
        className,
      )}
    >
      <AppDot appId={appId} />
      <span className="truncate">{name ?? appId}</span>
      {paid ? (
        <span role="img" aria-label={paidLabel} className="text-(--db-success)">
          $
        </span>
      ) : null}
    </span>
  );
}
