"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Stamp } from "@/components/ui/stamp";
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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<LowStockIndicatorLabels>;
  className?: string;
}

export interface LowStockIndicatorLabels {
  inStock: (n: number) => ReactNode;
  low: (n: number) => ReactNode;
  critical: (n: number) => ReactNode;
  soldOut: ReactNode;
  /** 量表的無障礙名稱 */
  meter: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, LowStockIndicatorLabels> = {
  en: {
    inStock: (n) => (
      <>
        <Count n={n} /> in stock
      </>
    ),
    low: (n) => (
      <>
        Only <Count n={n} /> left
      </>
    ),
    critical: (n) => (
      <>
        Last <Count n={n} /> in stock
      </>
    ),
    soldOut: <>Sold out</>,
    meter: "Stock level",
  },
  "zh-TW": {
    inStock: (n) => (
      <>
        尚有 <Count n={n} /> 件庫存
      </>
    ),
    low: (n) => (
      <>
        只剩 <Count n={n} /> 件
      </>
    ),
    critical: (n) => (
      <>
        最後 <Count n={n} /> 件
      </>
    ),
    soldOut: <>已售完</>,
    meter: "庫存量",
  },
  "zh-CN": {
    inStock: (n) => (
      <>
        现有库存 <Count n={n} /> 件
      </>
    ),
    low: (n) => (
      <>
        仅剩 <Count n={n} /> 件
      </>
    ),
    critical: (n) => (
      <>
        最后 <Count n={n} /> 件
      </>
    ),
    soldOut: <>已售罄</>,
    meter: "库存量",
  },
  ja: {
    inStock: (n) => (
      <>
        在庫 <Count n={n} /> 点
      </>
    ),
    low: (n) => (
      <>
        残り <Count n={n} /> 点
      </>
    ),
    critical: (n) => (
      <>
        残りわずか <Count n={n} /> 点
      </>
    ),
    soldOut: <>売り切れ</>,
    meter: "在庫量",
  },
};

// 設計語言（DESIGN.md）：紙邊、墨、朱紅
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
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
  locale = "en",
  labels,
  className,
}: LowStockIndicatorProps) {
  const reduceMotion = !!useReducedMotion();
  const labelId = useId();
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
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
              <>
                <Stamp tone="ink" seed="sold-out" appear={stampLive}>
                  {t.soldOut}
                </Stamp>
                <span className="sr-only">{t.soldOut}</span>
              </>
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
