"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StockLevel = "in-stock" | "low" | "critical" | "sold-out";

export interface LowStockIndicatorProps {
  /** 真實庫存數量；元件只呈現資料，不會自行倒數 */
  stock: number;
  /** 量表滿格代表的數量，通常是補貨量；24 以內逐格印出 */
  capacity?: number;
  /** 庫存小於等於此值時進入 low */
  lowAt?: number;
  /** 庫存小於等於此值時進入 critical（朱紅） */
  criticalAt?: number;
  /** 資料更新時間，例如 "Updated 2 min ago"，讓緊迫感有根據 */
  updatedLabel?: ReactNode;
  labels?: {
    inStock?: (n: number) => ReactNode;
    low?: (n: number) => ReactNode;
    critical?: (n: number) => ReactNode;
    soldOut?: ReactNode;
    /** 量表的無障礙名稱 */
    meter?: string;
  };
  className?: string;
}

const defaultLabels = {
  inStock: (n: number) => (
    <>
      <Count n={n} /> in stock
    </>
  ),
  low: (n: number) => (
    <>
      Only <Count n={n} /> left
    </>
  ),
  critical: (n: number) => (
    <>
      Last <Count n={n} /> in stock
    </>
  ),
  soldOut: <>Sold out</>,
  meter: "Stock level",
};

// 設計語言（DESIGN.md）：紙邊、墨、朱紅
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

const MAX_SLIPS = 24;

export function getStockLevel(stock: number, lowAt: number, criticalAt: number): StockLevel {
  if (stock <= 0) return "sold-out";
  if (stock <= criticalAt) return "critical";
  if (stock <= lowAt) return "low";
  return "in-stock";
}

export function LowStockIndicator({
  stock,
  capacity = 20,
  lowAt = 10,
  criticalAt = 3,
  updatedLabel,
  labels,
  className,
}: LowStockIndicatorProps) {
  const reduceMotion = !!useReducedMotion();
  const labelId = useId();
  const t = { ...defaultLabels, ...labels };
  const safeStock = Math.max(0, Math.floor(stock));
  const level = getStockLevel(safeStock, lowAt, criticalAt);
  const critical = level === "critical";
  const ratio = capacity > 0 ? Math.min(safeStock / capacity, 1) : 0;
  const slips = capacity > 0 && capacity <= MAX_SLIPS ? Math.floor(capacity) : 0;

  // 數量下降時從上方翻入，補貨時從下方翻入；在同一次 render 推導方向
  const [prevStock, setPrevStock] = useState(safeStock);
  const [dir, setDir] = useState<1 | -1>(-1);
  if (safeStock !== prevStock) {
    setPrevStock(safeStock);
    setDir(safeStock < prevStock ? -1 : 1);
  }

  // 一開始就售完時直接印好；賣到售完那一刻才蓋章
  const wasSoldOut = useRef(level === "sold-out");
  const [stampLive, setStampLive] = useState(false);
  useEffect(() => {
    if (level === "sold-out" && !wasSoldOut.current) setStampLive(true);
    wasSoldOut.current = level === "sold-out";
  }, [level]);

  const message = level === "critical" ? t.critical(safeStock) : level === "low" ? t.low(safeStock) : t.inStock(safeStock);

  return (
    <CountContext.Provider value={{ dir, reduceMotion, tone: critical ? vermilion : "" }}>
      <div className={cn("w-full space-y-2 font-sans", className)}>
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
          <p id={labelId} role="status" aria-live="polite" className="flex items-center">
            {level === "sold-out" ? (
              <motion.span
                className={cn("inline-block rounded-[3px] border-2 border-current px-2 py-0.5 text-xs font-bold tracking-[0.2em] uppercase", inkMuted)}
                initial={reduceMotion || !stampLive ? false : { scale: 1.6, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: -6 }}
                transition={springs.stamp}
              >
                {t.soldOut}
              </motion.span>
            ) : (
              <span>{message}</span>
            )}
          </p>
          {updatedLabel && <span className={cn("shrink-0 text-xs", inkMuted)}>{updatedLabel}</span>}
        </div>

        <div
          role="meter"
          aria-label={t.meter}
          aria-describedby={labelId}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-valuenow={Math.min(safeStock, capacity)}
          className={cn(critical && vermilion)}
        >
          {slips > 0 ? (
            // 每格一件，像撕剩的票根
            <div aria-hidden="true" className="flex gap-[2px]">
              {Array.from({ length: slips }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-[1px] border transition-colors duration-200",
                    i < safeStock ? "border-transparent bg-current" : cn(edge, "bg-transparent"),
                  )}
                />
              ))}
            </div>
          ) : (
            <div aria-hidden="true" className="relative h-[3px]">
              <span className={cn("absolute inset-x-0 top-px border-t", edge)} />
              <motion.span
                className="absolute inset-0 origin-left bg-current"
                initial={false}
                animate={{ scaleX: ratio }}
                transition={reduceMotion ? { duration: 0 } : springs.gentle}
              />
            </div>
          )}
        </div>
      </div>
    </CountContext.Provider>
  );
}

const CountContext = createContext<{ dir: 1 | -1; reduceMotion: boolean; tone: string }>({ dir: -1, reduceMotion: false, tone: "" });

/** 數字變化時上下翻動，讓使用者注意到真實的庫存變化 */
function Count({ n }: { n: number }) {
  const { dir, reduceMotion, tone } = useContext(CountContext);
  return (
    <span className={cn("relative inline-grid overflow-hidden align-bottom font-semibold tabular-nums", tone)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={n}
          className="inline-block"
          initial={reduceMotion ? false : { y: dir === -1 ? "-100%" : "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: dir === -1 ? "100%" : "-100%", opacity: 0 }}
          transition={springs.snappy}
        >
          {n}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
