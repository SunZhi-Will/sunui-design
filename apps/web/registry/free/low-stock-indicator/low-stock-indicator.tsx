"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Result } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export type StockLevel = "in-stock" | "low" | "critical" | "sold-out";

export interface LowStockIndicatorProps {
  /** Real stock count; the component only presents data and never counts down by itself */
  stock: number;
  /** Quantity a full gauge represents, usually the restock amount; up to 24 it prints one cell per unit */
  capacity?: number;
  /** Enters the low state when stock is at or below this value */
  lowAt?: number;
  /** Enters the critical state (vermilion) when stock is at or below this value */
  criticalAt?: number;
  /** When the data was last updated, for example "Updated 2 min ago", so the urgency has a basis */
  updatedLabel?: ReactNode;
  /** UI language: en, zh-TW, zh-CN, ja. Tags like zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides built-in strings, takes precedence over locale */
  labels?: Partial<LowStockIndicatorLabels>;
  className?: string;
}

export interface LowStockIndicatorLabels {
  inStock: (n: number) => ReactNode;
  low: (n: number) => ReactNode;
  critical: (n: number) => ReactNode;
  soldOut: ReactNode;
  /** Accessible name of the gauge */
  meter: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
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

// Design language (DESIGN.md): border, ink, brand accent
const edge = "border-foreground/10";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand color. Used only for selection, offers and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

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

  // The digit flips in from above when the count drops and from below on restock; the direction is derived during the same render
  const [prevStock, setPrevStock] = useState(safeStock);
  const [dir, setDir] = useState<1 | -1>(-1);
  if (safeStock !== prevStock) {
    setPrevStock(safeStock);
    setDir(safeStock < prevStock ? -1 : 1);
  }

  // If it starts sold out, the stamp is already printed; it only lands at the moment stock sells out
  const wasSoldOut = useRef(level === "sold-out");
  const [stampLive, setStampLive] = useState(false);
  useEffect(() => {
    if (level === "sold-out" && !wasSoldOut.current) setStampLive(true);
    wasSoldOut.current = level === "sold-out";
  }, [level]);

  const message = level === "critical" ? t.critical(safeStock) : level === "low" ? t.low(safeStock) : t.inStock(safeStock);

  return (
    <CountContext.Provider value={{ dir, reduceMotion, tone: critical ? spot : "" }}>
      <div className={cn("w-full space-y-2 font-sans", className)}>
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
          <p id={labelId} role="status" aria-live="polite" className="flex items-center">
            {level === "sold-out" ? (
              <>
                <Result tone="muted" seed="sold-out" appear={stampLive}>
                  {t.soldOut}
                </Result>
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
          className={cn(critical && spot)}
        >
          {slips > 0 ? (
            // One cell per unit, like the stubs left on a torn ticket
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

/** The number flips up or down when it changes, so users notice a real stock change */
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
