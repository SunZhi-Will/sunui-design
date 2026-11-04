"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * 識別色（usermeld person-chip、spliteat employee-chip、Schedary 共用）
 * ────────────────────────────────────────────────────────────── */

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

/** 專案的識別色，同一個專案在所有畫面永遠是同一個顏色 */
export function appColor(appId: string) {
  return personColor(hashId(appId));
}

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

/* ──────────────────────────────────────────────────────────────
 * WorkBadge（Synvize StatusBadge）：黑金品牌，預設暗色
 * ────────────────────────────────────────────────────────────── */

export type WorkTone = "success" | "warning" | "brand" | "neutral";

// Synvize tokens.css 的暗色（品牌預設）與保留給反轉區塊的亮色
const SYNVIZE = {
  dark: {
    "--sv-text-2": "#a8a296",
    "--sv-line-1": "rgba(212, 175, 55, 0.14)",
    "--sv-gold": "#d4af37",
    "--sv-success": "#7fc4a0",
    "--sv-warning": "#e8d4a0",
    "--sv-brand-2": "#e8c874",
    "--sv-tint-success": "rgba(127, 196, 160, 0.12)",
    "--sv-tint-warning": "rgba(212, 175, 55, 0.12)",
    "--sv-tint-brand": "rgba(212, 175, 55, 0.1)",
    "--sv-tint-neutral": "rgba(247, 245, 240, 0.06)",
  },
  light: {
    "--sv-text-2": "#3d3730",
    "--sv-line-1": "rgba(94, 78, 18, 0.18)",
    "--sv-gold": "#5e4e12",
    "--sv-success": "#1f7a4d",
    "--sv-warning": "#5e4e12",
    "--sv-brand-2": "#6b5a1f",
    "--sv-tint-success": "color-mix(in srgb, #1f7a4d 12%, transparent)",
    "--sv-tint-warning": "rgba(212, 175, 55, 0.12)",
    "--sv-tint-brand": "color-mix(in srgb, #5e4e12 10%, transparent)",
    "--sv-tint-neutral": "color-mix(in srgb, #08080a 6%, transparent)",
  },
} as const;

// 每個 tone 是完整自成一體的一組值，不跟基底疊加同一個屬性
const TONE_CLASSES: Record<WorkTone, string> = {
  success: "bg-(--sv-tint-success) text-(--sv-success)",
  warning: "bg-(--sv-tint-warning) text-(--sv-warning)",
  brand: "bg-(--sv-tint-brand) text-(--sv-brand-2)",
  neutral: "bg-(--sv-tint-neutral) text-(--sv-text-2)",
};

// 有限次數的呼吸：WCAG 2.2.2 不允許無限期自動動態，脈動 3 次即停；減少動態時不播
const BREATHE_CSS = `@keyframes sv-dot-breathe{0%,100%{opacity:1;box-shadow:0 0 0 0 color-mix(in srgb,var(--sv-gold) 45%,transparent)}50%{opacity:.6;box-shadow:0 0 0 4px transparent}}@media (prefers-reduced-motion:no-preference){.sv-badge__dot--live{animation:sv-dot-breathe 2.4s cubic-bezier(0.65,0,0.35,1) 3 both}}`;

/**
 * 狀態徽章：圓點與文字同時存在，狀態不只靠顏色。
 * 圓點對螢幕閱讀器隱藏，文字才是資訊來源。
 */
export function WorkBadge({
  tone,
  label,
  live = false,
  hint,
  theme = "dark",
  className,
}: {
  tone: WorkTone;
  label: string;
  /** 圓點呼吸，代表「正在進行」 */
  live?: boolean;
  /** 額外的螢幕閱讀器說明，視覺上隱藏 */
  hint?: string;
  /** Synvize 品牌強制暗色，light 是保留給反轉區塊的配色 */
  theme?: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      style={SYNVIZE[theme] as CSSProperties}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-(--sv-line-1) px-3 py-1 font-mono text-[0.6875rem] tracking-[0.04em] whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {live ? <style>{BREATHE_CSS}</style> : null}
      <span aria-hidden className={cn("relative size-1.5 flex-none rounded-full bg-current", live && "sv-badge__dot--live")} />
      {label}
      {hint ? <span className="sr-only">. {hint}</span> : null}
    </span>
  );
}

/** Synvize 作品狀態到 tone 的對應 */
export type WorkStatus = "available" | "public-beta" | "private-beta" | "prototype" | "paused" | "archived";

export const WORK_STATUS_TONE: Record<WorkStatus, WorkTone> = {
  available: "success",
  "public-beta": "warning",
  "private-beta": "warning",
  prototype: "brand",
  paused: "neutral",
  archived: "neutral",
};

const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  available: "Available",
  "public-beta": "Public beta",
  "private-beta": "Private beta",
  prototype: "Prototype",
  paused: "Paused",
  archived: "Archived",
};

export function StatusBadge({
  status,
  label,
  help,
  theme,
}: {
  status: WorkStatus;
  label?: string;
  /** 螢幕閱讀器的補充說明 */
  help?: string;
  theme?: "dark" | "light";
}) {
  return <WorkBadge tone={WORK_STATUS_TONE[status]} label={label ?? WORK_STATUS_LABEL[status]} hint={help} theme={theme} />;
}
