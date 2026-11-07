"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AddonItem {
  id: string;
  label: ReactNode;
  /** 品項下方的一行說明，例如「每件 +$4」 */
  note?: ReactNode;
  price: number;
  /** 必選項目：永遠勾選、不能取消，例如基本運費 */
  required?: boolean;
}

export interface AddonChecklistLabels {
  /** 未傳 title 時的預設標題 */
  title?: ReactNode;
  base?: ReactNode;
  subtotal?: ReactNode;
  required?: ReactNode;
  free?: ReactNode;
  /** 給螢幕閱讀器的小計朗讀文字 */
  announce?: (total: string, count: number) => string;
}

export interface AddonChecklistProps {
  title?: ReactNode;
  /** 主商品價格，列在第一行，不能取消 */
  basePrice?: number;
  items: AddonItem[];
  /** 受控模式：目前勾選的 id */
  value?: string[];
  defaultValue?: string[];
  /** 回傳勾選的 id 與畫面上的總額；伺服器結帳時仍要自行重算 */
  onChange?: (ids: string[], total: number) => void;
  /** 介面語言與金額格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  currency?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: AddonChecklistLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<AddonChecklistLabels>> = {
  en: {
    title: "Add to your order",
    base: "Base item",
    subtotal: "Subtotal",
    required: "Included",
    free: "Free",
    announce: (total, count) => `${count} ${count === 1 ? "add-on" : "add-ons"} selected. Subtotal ${total}.`,
  },
  "zh-TW": {
    title: "加購項目",
    base: "主商品",
    subtotal: "小計",
    required: "必選",
    free: "免費",
    announce: (total, count) => `已選 ${count} 項加購，小計 ${total}。`,
  },
  "zh-CN": {
    title: "加购项目",
    base: "主商品",
    subtotal: "小计",
    required: "必选",
    free: "免费",
    announce: (total, count) => `已选 ${count} 项加购，小计 ${total}。`,
  },
  ja: {
    title: "ご注文に追加",
    base: "本体",
    subtotal: "小計",
    required: "必須",
    free: "無料",
    announce: (total, count) => `オプションを ${count} 件選択中。小計 ${total}。`,
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export function AddonChecklist({
  title: titleProp,
  basePrice,
  items,
  value,
  defaultValue = [],
  onChange,
  locale = "en-US",
  currency = "USD",
  labels,
  className,
}: AddonChecklistProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const title = titleProp ?? t.title;
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState<string[]>(defaultValue);
  const [announcement, setAnnouncement] = useState("");

  const fmt = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }), [locale, currency]);
  const chosen = value ?? inner;
  const isOn = (item: AddonItem) => item.required || chosen.includes(item.id);
  const totalOf = (ids: string[]) =>
    Math.round(((basePrice ?? 0) + items.reduce((s, it) => s + (it.required || ids.includes(it.id) ? it.price : 0), 0)) * 100) / 100;
  const total = totalOf(chosen);

  function toggle(item: AddonItem) {
    if (item.required) return;
    const next = chosen.includes(item.id) ? chosen.filter((id) => id !== item.id) : [...chosen, item.id];
    if (value === undefined) setInner(next);
    const nextTotal = totalOf(next);
    onChange?.(next, nextTotal);
    setAnnouncement(t.announce(fmt.format(nextTotal), next.length));
  }

  // 小計：數值改變時用 gentle 彈簧滾到新值；reduced motion 直接跳
  const mv = useMotionValue(total);
  const shown = useTransform(mv, (n) => fmt.format(n));
  useEffect(() => {
    if (reduceMotion) {
      mv.set(total);
      return;
    }
    const controls = animate(mv, total, springs.gentle);
    return () => controls.stop();
  }, [total, reduceMotion, mv]);

  return (
    <div className={cn("w-full max-w-sm min-w-[17rem] rounded-md border px-5 pt-4 pb-3 font-sans", paper, edge, ink, className)}>
      <p className={cn("border-b border-dashed pb-3 text-sm font-semibold tracking-tight", edge)}>{title}</p>

      <ul className="py-2" aria-label={typeof title === "string" ? title : undefined}>
        {basePrice !== undefined && (
          <li className="flex items-baseline gap-2 py-1.5 text-sm">
            <span className="font-medium">{t.base}</span>
            <Leader />
            <span className="font-medium tracking-tight tabular-nums">{fmt.format(basePrice)}</span>
          </li>
        )}
        {items.map((item) => {
          const on = isOn(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={item.required || undefined}
                onClick={() => toggle(item)}
                className={cn(
                  "-mx-2 flex w-[calc(100%+1rem)] items-start gap-2.5 rounded-md px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  item.required ? "cursor-default" : "hover:bg-current/5",
                )}
              >
                <motion.span
                  aria-hidden="true"
                  whileTap={reduceMotion || item.required ? undefined : { scale: 0.85 }}
                  transition={springs.snappy}
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[3px] border",
                    on ? cn(spotBorder, spot) : edge,
                    item.required && inkMuted,
                  )}
                >
                  {on && <CheckIcon />}
                </motion.span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={cn("font-medium", !on && inkMuted)}>{item.label}</span>
                    <Leader />
                    <span className={cn("shrink-0 tracking-tight tabular-nums", on ? "font-medium" : inkMuted)}>
                      {item.price === 0 ? t.free : `+${fmt.format(item.price)}`}
                    </span>
                  </span>
                  {(item.note || item.required) && (
                    <span className={cn("mt-0.5 block text-xs", inkMuted)}>
                      {item.required ? t.required : null}
                      {item.required && item.note ? " · " : null}
                      {item.note}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={cn("flex items-baseline justify-between gap-3 border-t border-dashed pt-3", edge)}>
        <span className={cn("text-xs tracking-[0.14em] uppercase", inkMuted)}>{t.subtotal}</span>
        <motion.span className="text-lg font-semibold tracking-tight tabular-nums" aria-hidden="true">
          {shown}
        </motion.span>
        <span className="sr-only">{fmt.format(total)}</span>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

/** 收據上品名與金額之間的點線 */
function Leader() {
  return <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-current opacity-30" />;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
