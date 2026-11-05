"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SunUI 的結果標記：直立、墨色、跟著版面排，不壓在內容上。
 * 正面結果前面有一個勾；失效、結束、未中獎用淡墨，不加勾。
 * shape 決定附帶的資訊，不決定外觀：
 * - tick、box：只有文字（已複製、已領取、已售完）
 * - date：文字加日期（已付款 2026.11.06）
 * - seal：文字加第二行（中獎、等級名稱）
 * - chop：文字（受邀、會員名）
 * 結果以外的標籤（推薦、熱門）不要用它。
 */
export type StampShape = "tick" | "box" | "seal" | "date" | "chop";
/** vermilion 保留名稱以相容舊程式，現在代表「正面結果」，顯示為墨色 */
export type StampTone = "vermilion" | "ink";
export type StampSize = "sm" | "md" | "lg";

export interface StampProps {
  children?: ReactNode;
  shape?: StampShape;
  /** vermilion：正面結果（墨色加勾）；ink：失效、結束、未中獎（淡墨）。tick 以外預設 vermilion */
  tone?: StampTone;
  size?: StampSize;
  /** 已不影響外觀，保留以相容舊程式 */
  seed?: string | number;
  /** date 顯示的日期；seal 沒有 sub 時也可當第二行 */
  date?: Date | string | number;
  /** seal 的第二行，例如等級名稱 */
  sub?: ReactNode;
  /** 已不影響外觀，保留以相容舊程式 */
  filled?: boolean;
  /** 加刪除線，表示作廢 */
  void?: boolean;
  /** false 時直接顯示，不淡入（例如重新整理後的已領取狀態） */
  appear?: boolean;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

const strong = "text-[#171717] dark:text-[#ededed]";
const muted = "text-[#171717]/55 dark:text-[#ededed]/55";

const TEXT: Record<StampSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const ICON: Record<StampSize, string> = { sm: "size-3.5", md: "size-4", lg: "size-[18px]" };

function formatDate(value: Date | string | number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export function Stamp({
  children,
  shape = "box",
  tone: toneProp,
  size = "md",
  date,
  sub,
  void: voided = false,
  appear = true,
  delay = 0,
  className,
  style,
}: StampProps) {
  const reduce = useReducedMotion() ?? false;
  const positive = (toneProp ?? "vermilion") === "vermilion";
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
      className={cn("pointer-events-none inline-flex items-center gap-1.5 leading-tight font-medium whitespace-nowrap", TEXT[size], positive ? strong : muted, className)}
    >
      {positive && (
        <svg viewBox="0 0 24 24" className={cn("shrink-0", ICON[size])} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={animate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={animate ? { duration: 0.2, ease: "easeOut", delay } : { duration: 0 }}
          />
        </svg>
      )}
      <span className={cn(voided && "line-through decoration-1")}>{children}</span>
      {second && <span className={cn("font-mono font-normal tabular-nums", muted)}>{second}</span>}
    </motion.span>
  );
}
