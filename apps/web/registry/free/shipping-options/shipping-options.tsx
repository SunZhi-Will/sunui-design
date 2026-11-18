"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ShippingOption {
  id: string;
  /** 配送方式，例如「宅配」「超商取貨」 */
  name: ReactNode;
  /** 預計到貨，例如「Thu, Nov 7」或「2 到 3 個工作天」 */
  eta: ReactNode;
  /** 運費；0 顯示為免運 */
  fee: number;
  /** 小字補充，例如承運商或取件說明 */
  note?: ReactNode;
  disabled?: boolean;
}

export interface ShippingOptionsProps {
  options: ShippingOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** radiogroup 的無障礙名稱 */
  label?: string;
  /** 介面語言與金額格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  currency?: string;
  freeLabel?: ReactNode;
  etaLabel?: ReactNode;
  /** 覆寫內建字串，優先於 locale；label、freeLabel、etaLabel 又優先於這裡 */
  labels?: Partial<ShippingOptionsLabels>;
  className?: string;
}

export interface ShippingOptionsLabels {
  label: string;
  free: ReactNode;
  eta: ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ShippingOptionsLabels> = {
  en: { label: "Delivery method", free: "Free", eta: "Arrives" },
  "zh-TW": { label: "配送方式", free: "免運", eta: "預計到貨" },
  "zh-CN": { label: "配送方式", free: "包邮", eta: "预计送达" },
  ja: { label: "配送方法", free: "送料無料", eta: "お届け予定" },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

/** 左欄（配送方式與選取圈）寬度 */
const STUB = "5.75rem";

export function ShippingOptions({
  options,
  value,
  defaultValue,
  onChange,
  label: labelProp,
  locale = "en-US",
  currency = "USD",
  freeLabel: freeProp,
  etaLabel: etaProp,
  labels,
  className,
}: ShippingOptionsProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const label = labelProp ?? t.label;
  const freeLabel = freeProp ?? t.free;
  const etaLabel = etaProp ?? t.eta;
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState(defaultValue ?? options.find((o) => !o.disabled)?.id);
  const selected = value ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });

  // roving tabindex：選中的那張可 Tab 進入；沒有選中時第一張可用的
  const focusable = options.findIndex((o) => o.id === selected && !o.disabled);
  const tabStop = focusable >= 0 ? focusable : options.findIndex((o) => !o.disabled);

  function select(id: string) {
    if (value === undefined) setInner(id);
    if (id !== selected) onChange?.(id);
  }

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    for (let i = 1; i <= options.length; i++) {
      const next = (index + step * i + options.length) % options.length;
      if (!options[next].disabled) {
        refs.current[next]?.focus();
        select(options[next].id);
        return;
      }
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-3 font-sans", ink, className)}
    >
      {options.map((o, i) => {
        const on = o.id === selected;
        return (
          <motion.button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={o.disabled || undefined}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => !o.disabled && select(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            whileTap={reduceMotion || o.disabled ? undefined : { scale: 0.98 }}
            transition={springs.snappy}
            className={cn(
              "group relative isolate flex min-h-[5.5rem] items-stretch rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              o.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {/* 表面另成一層，選取時只換邊線顏色，焦點框不受影響 */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 -z-10 rounded-xl border",
                surface,
                on ? spotBorder : edge,
                !on && !o.disabled && "group-hover:border-foreground/30",
              )}
            />
            {/* 左欄：配送方式與選取圈 */}
            <span className="flex shrink-0 flex-col justify-between gap-2 px-3 py-3" style={{ width: STUB }}>
              <Dot on={on} reduceMotion={!!reduceMotion} />
              <span className="text-sm leading-tight font-semibold tracking-tight">{o.name}</span>
            </span>
            <span aria-hidden="true" className={cn("my-2 border-l", on ? "border-current/40" : edge)} />
            {/* 右欄：到貨日與運費 */}
            <span className="flex min-w-0 flex-1 items-start justify-between gap-3 px-3.5 py-3">
              <span className="min-w-0">
                <span className={cn("block text-[11px] tracking-[0.14em] uppercase", inkMuted)}>{etaLabel}</span>
                <span className="mt-0.5 block text-sm font-medium tabular-nums">{o.eta}</span>
                {o.note && <span className={cn("mt-1 block text-xs", inkMuted)}>{o.note}</span>}
              </span>
              <span className={cn("shrink-0 text-base font-semibold tracking-tight tabular-nums", o.fee === 0 && spot)}>
                {o.fee === 0 ? freeLabel : fmt.format(o.fee)}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** 選取圈：選中時中心墨點以 snappy 彈簧壓入 */
function Dot({ on, reduceMotion }: { on: boolean; reduceMotion: boolean }) {
  return (
    <span aria-hidden="true" className={cn("grid size-4 place-items-center rounded-full border", on ? cn("border-current", spot) : edge)}>
      <motion.span
        className="size-2 rounded-full bg-current"
        initial={false}
        animate={{ scale: on ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0 } : springs.snappy}
      />
    </span>
  );
}
