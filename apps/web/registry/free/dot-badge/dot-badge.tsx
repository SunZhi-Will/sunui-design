"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DotTone = "neutral" | "success" | "warning" | "danger" | "info" | "live";

// 設計語言（DESIGN.md）：狀態色只上在小點，文字維持墨色
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";

const toneClass: Record<DotTone, string> = {
  neutral: "bg-[#1c1917]/35 dark:bg-[#ece7dc]/35",
  success: "bg-emerald-600 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-destructive",
  info: "bg-sky-600 dark:bg-sky-400",
  live: "bg-emerald-600 dark:bg-emerald-400",
};

/** 依 id 算出固定色相，同一個人每次都是同一個顏色 */
export function personHue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

const cjk = /[㐀-鿿豈-﫿]/;

/** 中文名取最後一個字（小明 → 明），其他取第一個字母 */
export function initialOf(name: string) {
  const n = name.trim();
  if (!n) return "?";
  const chars = Array.from(n).filter((c) => cjk.test(c));
  if (chars.length) return chars[chars.length - 1];
  return Array.from(n)[0].toUpperCase();
}

export interface StatusDotProps {
  tone?: DotTone;
  className?: string;
}

export function StatusDot({ tone = "neutral", className }: StatusDotProps) {
  const reduce = useReducedMotion();
  const breathing = tone === "live" && !reduce;
  return (
    <motion.span
      aria-hidden="true"
      className={cn("inline-block size-1.5 shrink-0 rounded-full", toneClass[tone], className)}
      // 只有進行中狀態才呼吸，其餘靜止
      animate={breathing ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
      transition={breathing ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
    />
  );
}

export interface DotBadgeProps {
  tone?: DotTone;
  children: ReactNode;
  /** 只給螢幕閱讀器的補充說明 */
  hint?: string;
  mono?: boolean;
  className?: string;
}

export function DotBadge({ tone = "neutral", children, hint, mono = false, className }: DotBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-xs whitespace-nowrap",
        edge,
        ink,
        mono && "font-mono text-[11px] tracking-[0.12em] uppercase",
        className,
      )}
    >
      <StatusDot tone={tone} />
      {children}
      {hint && <span className="sr-only">, {hint}</span>}
    </span>
  );
}

export type PersonChipSize = "sm" | "md";

export interface PersonChipProps {
  id: string;
  name: string;
  /** 有傳就變成可切換的按鈕（aria-pressed） */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: PersonChipSize;
  muted?: boolean;
  locked?: boolean;
  /** 只顯示頭像，名字交給 aria-label */
  avatarOnly?: boolean;
  labels?: { locked?: string };
  className?: string;
}

const sizeClass: Record<PersonChipSize, { chip: string; avatar: string }> = {
  sm: { chip: "h-7 gap-1.5 pr-2.5 pl-0.5 text-xs", avatar: "size-6 text-[11px]" },
  md: { chip: "h-9 gap-2 pr-3 pl-1 text-sm", avatar: "size-7 text-xs" },
};

export function PersonChip({
  id,
  name,
  pressed,
  onPressedChange,
  size = "md",
  muted = false,
  locked = false,
  avatarOnly = false,
  labels,
  className,
}: PersonChipProps) {
  const toggle = pressed !== undefined || onPressedChange !== undefined;
  const on = Boolean(pressed);
  const s = sizeClass[size];
  const hueStyle = { "--h": personHue(id) } as CSSProperties;

  const avatar = (
    <span
      aria-hidden="true"
      style={hueStyle}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        // 低彩度：顏色只拿來分辨人，不搶畫面
        "bg-[hsl(var(--h)_32%_88%)] text-[hsl(var(--h)_35%_28%)] dark:bg-[hsl(var(--h)_18%_26%)] dark:text-[hsl(var(--h)_35%_82%)]",
        s.avatar,
      )}
    >
      {initialOf(name)}
    </span>
  );

  const body = (
    <>
      {avatar}
      {!avatarOnly && <span className="truncate">{name}</span>}
      {locked && (
        <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
      )}
    </>
  );

  const base = cn(
    "inline-flex max-w-full min-w-0 items-center rounded-full border font-medium transition-colors",
    s.chip,
    avatarOnly && "pr-0.5",
    on ? "border-transparent bg-[#1c1917] text-[#faf7f0] dark:bg-[#ece7dc] dark:text-[#1c1917]" : cn(edge, ink),
    muted && !on && "opacity-50",
    className,
  );

  if (!toggle) {
    return (
      <span className={base} aria-label={avatarOnly ? name : undefined}>
        {body}
        {locked && <span className="sr-only">{labels?.locked ?? "Locked"}</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={avatarOnly ? name : undefined}
      disabled={locked}
      onClick={() => onPressedChange?.(!on)}
      className={cn(
        base,
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !on && "hover:bg-[#1c1917]/[0.04] dark:hover:bg-[#ece7dc]/[0.06]",
        "disabled:cursor-not-allowed",
      )}
    >
      {body}
      {locked && <span className="sr-only">{labels?.locked ?? "Locked"}</span>}
    </button>
  );
}

/** 方便在列表中顯示次要資訊時使用 */
export function DotNote({ tone = "neutral", children }: { tone?: DotTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", inkMuted)}>
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}
