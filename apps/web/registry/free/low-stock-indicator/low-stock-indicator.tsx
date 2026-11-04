"use client";

import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StockLevel = "in-stock" | "low" | "critical" | "sold-out";

export interface LowStockIndicatorProps {
  /** 真實庫存數量；元件只呈現資料，不會自行倒數 */
  stock: number;
  /** 進度條滿格時代表的數量，通常是補貨量或平常庫存 */
  capacity?: number;
  /** 庫存小於等於此值時進入 low（琥珀色） */
  lowAt?: number;
  /** 庫存小於等於此值時進入 critical（玫瑰色） */
  criticalAt?: number;
  /** 顯示資料更新時間，例如 "Updated 2 min ago"，讓緊迫感有根據 */
  updatedLabel?: ReactNode;
  labels?: {
    inStock?: (n: number) => ReactNode;
    low?: (n: number) => ReactNode;
    critical?: (n: number) => ReactNode;
    soldOut?: ReactNode;
    /** 進度條的無障礙名稱 */
    meter?: string;
  };
  className?: string;
}

const defaultLabels = {
  inStock: (n: number) => (
    <>
      In stock, <Count n={n} /> available
    </>
  ),
  low: (n: number) => (
    <>
      Only <Count n={n} /> left
    </>
  ),
  critical: (n: number) => (
    <>
      Hurry, only <Count n={n} /> left
    </>
  ),
  soldOut: <>Sold out</>,
  meter: "Stock level",
};

const tone: Record<StockLevel, { text: string; bar: string; dot: string }> = {
  "in-stock": {
    text: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  low: { text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500", dot: "bg-amber-500" },
  critical: { text: "text-rose-700 dark:text-rose-400", bar: "bg-rose-500", dot: "bg-rose-500" },
  "sold-out": { text: "text-muted-foreground", bar: "bg-muted-foreground/40", dot: "bg-muted-foreground/60" },
};

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
  const reduceMotion = useReducedMotion();
  const labelId = useId();
  const text = { ...defaultLabels, ...labels };
  const safeStock = Math.max(0, Math.floor(stock));
  const level = getStockLevel(safeStock, lowAt, criticalAt);
  const t = tone[level];
  const ratio = capacity > 0 ? Math.min(safeStock / capacity, 1) : 0;

  const spring = useSpring(ratio, { stiffness: 90, damping: 20 });
  const width = useTransform(spring, (v) => `${v * 100}%`);
  useEffect(() => {
    if (reduceMotion) spring.jump(ratio);
    else spring.set(ratio);
  }, [ratio, reduceMotion, spring]);

  // 數量下降時從上方滑入，補貨時從下方滑入
  // 依 React 建議的「由前一個 props 推導」寫法，確保方向在同一次 render 就正確
  const [prevStock, setPrevStock] = useState(safeStock);
  const [dir, setDir] = useState<1 | -1>(-1);
  if (safeStock !== prevStock) {
    setPrevStock(safeStock);
    setDir(safeStock < prevStock ? -1 : 1);
  }

  const message =
    level === "sold-out"
      ? text.soldOut
      : level === "critical"
        ? text.critical(safeStock)
        : level === "low"
          ? text.low(safeStock)
          : text.inStock(safeStock);

  return (
    <CountContext.Provider value={{ dir, reduceMotion: !!reduceMotion }}>
      <div className={cn("w-full space-y-2", className)}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <p id={labelId} role="status" aria-live="polite" className={cn("flex items-center gap-2 font-medium", t.text)}>
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
              {level === "critical" && !reduceMotion && (
                <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", t.dot)} />
              )}
              <span className={cn("relative size-2.5 rounded-full", t.dot)} />
            </span>
            <span>{message}</span>
          </p>
          {updatedLabel && <span className="shrink-0 text-xs text-muted-foreground">{updatedLabel}</span>}
        </div>
        <div
          role="meter"
          aria-label={text.meter}
          aria-describedby={labelId}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-valuenow={Math.min(safeStock, capacity)}
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <motion.div className={cn("absolute inset-y-0 left-0 rounded-full transition-colors", t.bar)} style={{ width }} />
        </div>
      </div>
    </CountContext.Provider>
  );
}

const CountContext = createContext<{ dir: 1 | -1; reduceMotion: boolean }>({ dir: -1, reduceMotion: false });

/** 數字變化時上下翻動，讓使用者注意到真實的庫存變化 */
function Count({ n }: { n: number }) {
  const { dir, reduceMotion } = useContext(CountContext);
  return (
    <span className="relative inline-grid overflow-hidden align-bottom tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={n}
          className="inline-block font-semibold"
          initial={reduceMotion ? false : { y: dir === -1 ? "-100%" : "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: dir === -1 ? "100%" : "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >
          {n}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
