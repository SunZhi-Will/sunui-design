"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface QuotaMeterLabels {
  title?: ReactNode;
  /** count 是已格式化的剩餘量節點，低量時會變色 */
  left?: (count: ReactNode, unit: string) => ReactNode;
  used?: (percent: number) => ReactNode;
  resets?: (date: string) => ReactNode;
  meter?: (used: string, total: string) => string;
}

export interface QuotaMeterNudge {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface QuotaMeterProps {
  used: number;
  total: number;
  /** 以使用者看得懂的單位描述剩餘量，例如 images、minutes */
  unitLabel: string;
  /** 每個單位消耗的額度，用來換算「還能產生約 N 張」 */
  perUnit?: number;
  resetsAt?: Date | string | number;
  /** 例如今天還沒簽到時的提醒；取代第二行 */
  nudge?: QuotaMeterNudge;
  /** 剩餘比例低於此值時強調剩餘量 */
  lowAt?: number;
  variant?: "card" | "compact";
  locale?: string;
  labels?: QuotaMeterLabels;
  className?: string;
}

const defaultLabels: Required<QuotaMeterLabels> = {
  title: "Usage this month",
  left: (count, unit) => (
    <>
      About {count} {unit} left
    </>
  ),
  used: (p) => <>{p}% used</>,
  resets: (date) => <>Resets {date}</>,
  meter: (used, total) => `${used} of ${total} used`,
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export function QuotaMeter({
  used,
  total,
  unitLabel,
  perUnit = 1,
  resetsAt,
  nudge,
  lowAt = 0.1,
  variant = "card",
  locale = "en-US",
  labels,
  className,
}: QuotaMeterProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;

  // 日期只在瀏覽器格式化，避免伺服器與使用者時區不同造成 hydration 不一致
  const [resetText, setResetText] = useState<string | null>(null);
  useEffect(() => {
    if (resetsAt === undefined) return setResetText(null);
    setResetText(new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(resetsAt)));
  }, [resetsAt, locale]);

  const safeTotal = Math.max(total, 0);
  const remaining = Math.max(0, safeTotal - used);
  const estimate = Math.floor(remaining / Math.max(perUnit, Number.EPSILON));
  const fraction = safeTotal ? Math.min(1, Math.max(0, used / safeTotal)) : 1;
  const percent = Math.round(fraction * 100);
  const low = safeTotal > 0 && remaining / safeTotal <= lowAt;
  const nf = new Intl.NumberFormat(locale);

  const count = <span className={cn("font-semibold tabular-nums", low && vermilion)}>{nf.format(estimate)}</span>;

  const bar = (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={Math.min(used, safeTotal)}
      aria-valuetext={t.meter(nf.format(used), nf.format(safeTotal))}
      className={cn("relative h-px overflow-hidden bg-[#e7e0d0] dark:bg-[#38332b]", variant === "compact" ? "w-14" : "w-full")}
    >
      <motion.span
        className="absolute inset-y-0 left-0 block w-full origin-left bg-current"
        initial={false}
        animate={{ scaleX: fraction }}
        transition={reduce ? { duration: 0 } : springs.gentle}
      />
    </div>
  );

  const nudgeNode = nudge && (
    <NudgeLink nudge={nudge} className="font-medium underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
  );

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-2.5 rounded-md border px-2.5 py-1 text-xs whitespace-nowrap",
          paper,
          edge,
          ink,
          className,
        )}
      >
        {bar}
        <span className="truncate">{t.left(count, unitLabel)}</span>
        {nudgeNode && <span className={cn("hidden sm:inline", inkMuted)}>·</span>}
        {nudgeNode && <span className="hidden truncate sm:inline">{nudgeNode}</span>}
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-sm rounded-md border p-4 font-sans", paper, edge, ink, className)}>
      <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.title}</p>
      <p className="mt-2 text-lg leading-snug tracking-tight">{t.left(count, unitLabel)}</p>
      <div className="mt-3">{bar}</div>
      <p className={cn("mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs tabular-nums", inkMuted)}>
        {nudgeNode ? (
          <span className={ink}>{nudgeNode}</span>
        ) : (
          <span>{resetText ? t.resets(resetText) : " "}</span>
        )}
        <span>{t.used(percent)}</span>
      </p>
    </div>
  );
}

function NudgeLink({ nudge, className }: { nudge: QuotaMeterNudge; className?: string }) {
  if (nudge.href) {
    return (
      <a href={nudge.href} onClick={nudge.onClick} className={className}>
        {nudge.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={nudge.onClick} className={className}>
      {nudge.label}
    </button>
  );
}
