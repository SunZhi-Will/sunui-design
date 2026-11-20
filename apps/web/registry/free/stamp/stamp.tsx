"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SunUI's result marker, Result: place it where the action happened (where the button was, in a status bar, next to a step), not over the content.
 * Positive result: a small disc in the brand accent colour with a top-edge highlight, the check drawn as a stroke, and the disc settling once with the pop spring.
 * Expired, ended, did not win: faded text with no icon.
 * shape decides what extra information comes with it, not the look:
 * - tick, box: text only (Copied, Claimed, Sold out)
 * - date: text plus a date (Paid 2026.11.06)
 * - seal: text plus a second line (Winner, tier name)
 * - chop: text (Invited, member name)
 * Do not use it for labels that are not results (Recommended, Popular).
 *
 * Since 2026-11-19 the primary name is Result; Stamp is the old name, the same component, so existing installs keep working.
 * The file name and registry name stay stamp, so the install command is unchanged.
 */
export type ResultShape = "tick" | "box" | "seal" | "date" | "chop";
/** positive: positive result; muted: expired, ended, did not win. vermilion and ink are old names, equal to positive and muted respectively */
export type ResultTone = "positive" | "muted" | "vermilion" | "ink";
export type ResultSize = "sm" | "md" | "lg";

export interface ResultProps {
  children?: ReactNode;
  shape?: ResultShape;
  /** Defaults to positive */
  tone?: ResultTone;
  size?: ResultSize;
  /** No longer affects the look; kept for compatibility with old code */
  seed?: string | number;
  /** Date shown by date; also usable as the second line of seal when there is no sub */
  date?: Date | string | number;
  /** Second line of seal, e.g. a tier name */
  sub?: ReactNode;
  /** No longer affects the look; kept for compatibility with old code */
  filled?: boolean;
  /** Adds a strikethrough to mark it void */
  void?: boolean;
  /** When false, show immediately without the settle animation (e.g. the claimed state after a refresh) */
  appear?: boolean;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

// Same as pop in sunui-motion: the rebound of a small element settling once
const pop = { type: "spring", stiffness: 620, damping: 20, mass: 0.8 } as const;

const TEXT: Record<ResultSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const DISC: Record<ResultSize, string> = { sm: "size-4", md: "size-[18px]", lg: "size-5" };
const ICON: Record<ResultSize, string> = { sm: "size-2.5", md: "size-3", lg: "size-3.5" };

function formatDate(value: Date | string | number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export function Result({
  children,
  shape = "box",
  tone = "positive",
  size = "md",
  date,
  sub,
  void: voided = false,
  appear = true,
  delay = 0,
  className,
  style,
}: ResultProps) {
  const reduce = useReducedMotion() ?? false;
  const positive = tone === "positive" || tone === "vermilion";
  const animate = !reduce && appear;
  const second = shape === "seal" ? (sub ?? (date !== undefined ? formatDate(date) : null)) : shape === "date" && date !== undefined ? formatDate(date) : null;

  return (
    <motion.span
      aria-hidden="true"
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.12 } }}
      transition={animate ? { duration: 0.15, ease: "easeOut", delay } : { duration: 0 }}
      style={style}
      className={cn(
        "pointer-events-none inline-flex items-center gap-1.5 leading-tight font-medium whitespace-nowrap",
        TEXT[size],
        positive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {positive && (
        <motion.span
          initial={animate ? { scale: 0.6 } : false}
          animate={{ scale: 1 }}
          transition={animate ? { ...pop, delay } : { duration: 0 }}
          className={cn(
            "grid shrink-0 place-items-center rounded-full",
            "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]",
            "shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.12)]",
            DISC[size],
          )}
        >
          <svg viewBox="0 0 24 24" className={ICON[size]} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={animate ? { duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: delay + 0.06 } : { duration: 0 }}
            />
          </svg>
        </motion.span>
      )}
      <span className={cn(voided && "line-through decoration-1")}>{children}</span>
      {second && <span className="font-mono font-normal text-muted-foreground tabular-nums">{second}</span>}
    </motion.span>
  );
}

/** Old name, equal to Result */
export const Stamp = Result;
export type StampShape = ResultShape;
export type StampTone = ResultTone;
export type StampSize = ResultSize;
export type StampProps = ResultProps;
