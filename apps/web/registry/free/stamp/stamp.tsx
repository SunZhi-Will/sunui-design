"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * SunUI 的結果標記 Result：放在動作發生的地方（原本按鈕的位置、狀態欄、步驟旁），不壓在內容上。
 * 正面結果：一顆品牌專色的小圓片，帶頂邊高光，勾線描出，圓片用 pop 彈簧落定一次。
 * 失效、結束、未中獎：淡色文字，不加圖示。
 * shape 決定附帶的資訊，不決定外觀：
 * - tick、box：只有文字（已複製、已領取、已售完）
 * - date：文字加日期（已付款 2026.11.06）
 * - seal：文字加第二行（中獎、等級名稱）
 * - chop：文字（受邀、會員名）
 * 結果以外的標籤（推薦、熱門）不要用它。
 *
 * 2026-11-19 起主名稱是 Result；Stamp 是舊名，同一個元件，舊安裝照常可用。
 * 檔名與 registry 名稱維持 stamp，安裝指令不變。
 */
export type ResultShape = "tick" | "box" | "seal" | "date" | "chop";
/** positive：正面結果；muted：失效、結束、未中獎。vermilion 與 ink 是舊名，分別等於 positive 與 muted */
export type ResultTone = "positive" | "muted" | "vermilion" | "ink";
export type ResultSize = "sm" | "md" | "lg";

export interface ResultProps {
  children?: ReactNode;
  shape?: ResultShape;
  /** 預設 positive */
  tone?: ResultTone;
  size?: ResultSize;
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
  /** false 時直接顯示，不播落定（例如重新整理後的已領取狀態） */
  appear?: boolean;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

// 和 sunui-motion 的 pop 相同：小元件落定一次的回彈
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

/** 舊名，等於 Result */
export const Stamp = Result;
export type StampShape = ResultShape;
export type StampTone = ResultTone;
export type StampSize = ResultSize;
export type StampProps = ResultProps;
