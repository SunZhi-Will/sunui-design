"use client";

import { cn } from "@/lib/utils";

// 固定的識別色盤，只用在標籤前的小圓點。用 id 取餘數決定顏色，
// 同一個對象在不同畫面永遠是同一個顏色，整體畫面維持中性。
export const PERSON_PALETTE = [
  { bg: "#DBEAFE", fg: "#2563EB", ring: "#93C5FD" }, // blue
  { bg: "#DCFCE7", fg: "#16A34A", ring: "#86EFAC" }, // green
  { bg: "#FEF3C7", fg: "#D97706", ring: "#FCD34D" }, // amber
  { bg: "#FCE7F3", fg: "#DB2777", ring: "#F9A8D4" }, // pink
  { bg: "#EDE9FE", fg: "#7C3AED", ring: "#C4B5FD" }, // violet
  { bg: "#CFFAFE", fg: "#0891B2", ring: "#67E8F9" }, // cyan
  { bg: "#FFE4E6", fg: "#E11D48", ring: "#FDA4AF" }, // rose
  { bg: "#ECFCCB", fg: "#65A30D", ring: "#BEF264" }, // lime
] as const;

/**
 * 頭像用的單字：中文名取最後一字（小明→明、王大同→同），因為常見的「小」「阿」字首無法區分人；
 * 非中文名取第一個字母。
 */
export function personInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return /[一-鿿]/.test(trimmed) ? trimmed.slice(-1) : trimmed.slice(0, 1).toUpperCase();
}

export function personColor(personId: number) {
  const idx = ((personId % PERSON_PALETTE.length) + PERSON_PALETTE.length) % PERSON_PALETTE.length;
  return PERSON_PALETTE[idx];
}

/** 字串 id 轉成穩定的整數，供 personColor 使用 */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// 中性色系 app（Schedary、usermeld、spliteat、ComfyUI）共用的狀態色，淺色與深色各一組
const STATUS_TOKENS =
  "[--db-success:#15803D] [--db-warning:#B45309] [--db-danger:#DC2626] [--db-info:#4F46E5] dark:[--db-success:#4ADE80] dark:[--db-warning:#FBBF24] dark:[--db-danger:#F87171] dark:[--db-info:#818CF8]";

/* ──────────────────────────────────────────────────────────────
 * PersonChip（usermeld person-chip = spliteat employee-chip）
 * ────────────────────────────────────────────────────────────── */

function LockIcon({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3 shrink-0 opacity-70"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export interface PersonChipProps {
  name: string;
  personId: number;
  /** 異動過的項目：琥珀色外框 */
  highlighted?: boolean;
  /** 「自己的」項目：實心深色強調 */
  emphasized?: boolean;
  locked?: boolean;
  /** 正在側邊面板中檢視：深色外框 */
  selected?: boolean;
  /** 弱化「非自己」的項目 */
  muted?: boolean;
  onClick?: () => void;
  /** lg：手機版較大的觸控範圍 */
  size?: "default" | "lg";
  lockedLabel?: string;
  className?: string;
}

export function PersonChip({
  name,
  personId,
  highlighted,
  emphasized,
  locked,
  selected,
  muted,
  onClick,
  size = "default",
  lockedLabel = "Locked",
  className,
}: PersonChipProps) {
  const color = personColor(personId);
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      onClick={onClick}
      className={cn(
        STATUS_TOKENS,
        "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium whitespace-nowrap",
        size === "lg" ? "h-8 px-2.5 text-sm" : "h-6 px-2 text-xs",
        emphasized ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
        muted && "text-muted-foreground opacity-60",
        highlighted && "border-(--db-warning)/60 ring-1 ring-(--db-warning)",
        selected && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
        onClick && "cursor-pointer transition-colors hover:border-foreground/30 hover:bg-muted motion-reduce:transition-none",
        onClick && emphasized && "hover:bg-foreground/90",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: emphasized ? "currentColor" : color.fg }} />
      {locked ? <LockIcon label={lockedLabel} /> : null}
      {name}
    </Comp>
  );
}

/** spliteat、Schedary 的命名，與 PersonChip 完全相同 */
export function EmployeeChip({ employeeId, ...props }: Omit<PersonChipProps, "personId"> & { employeeId: number }) {
  return <PersonChip personId={employeeId} {...props} />;
}
