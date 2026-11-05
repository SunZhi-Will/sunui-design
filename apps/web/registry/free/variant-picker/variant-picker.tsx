"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface VariantColor {
  id: string;
  /** 顏色名稱，同時作為色票的 aria-label */
  name: string;
  /** 色票填色，例如 "#d8cfc0" */
  swatch: string;
}

export interface VariantSize {
  id: string;
  label: string;
}

export interface VariantValue {
  color?: string;
  size?: string;
}

export interface VariantPickerLabels {
  color?: ReactNode;
  size?: ReactNode;
  soldOut?: string;
  inStock?: ReactNode;
  lowStock?: (n: number) => ReactNode;
  pickSize?: ReactNode;
  /** 售完選項的無障礙名稱 */
  soldOutItem?: (name: string) => string;
}

export interface VariantPickerProps {
  colors: VariantColor[];
  sizes: VariantSize[];
  /** 每個組合的庫存，key 為 `${colorId}:${sizeId}`；沒列到視為售完 */
  stock: Record<string, number>;
  value?: VariantValue;
  defaultValue?: VariantValue;
  onChange?: (value: VariantValue) => void;
  /** 庫存小於等於此數字時顯示「剩 N 件」 */
  lowStockAt?: number;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: VariantPickerLabels;
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

const MESSAGES: Record<SunLocale, Required<VariantPickerLabels>> = {
  en: {
    color: "Colour",
    size: "Size",
    soldOut: "Sold out",
    inStock: "In stock",
    lowStock: (n) => <>Only {n} left</>,
    pickSize: "Select a size",
    soldOutItem: (name) => `${name}, sold out`,
  },
  "zh-TW": {
    color: "顏色",
    size: "尺寸",
    soldOut: "售完",
    inStock: "有現貨",
    lowStock: (n) => <>只剩 {n} 件</>,
    pickSize: "請選擇尺寸",
    soldOutItem: (name) => `${name}，售完`,
  },
  "zh-CN": {
    color: "颜色",
    size: "尺码",
    soldOut: "售罄",
    inStock: "有现货",
    lowStock: (n) => <>仅剩 {n} 件</>,
    pickSize: "请选择尺码",
    soldOutItem: (name) => `${name}，售罄`,
  },
  ja: {
    color: "カラー",
    size: "サイズ",
    soldOut: "売り切れ",
    inStock: "在庫あり",
    lowStock: (n) => <>残り {n} 点</>,
    pickSize: "サイズを選択してください",
    soldOutItem: (name) => `${name}、売り切れ`,
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

export function VariantPicker({
  colors,
  sizes,
  stock,
  value,
  defaultValue,
  onChange,
  lowStockAt = 3,
  locale = "en",
  labels,
  className,
}: VariantPickerProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  // 只覆寫 soldOut 時，無障礙名稱沿用舊格式「名稱, soldOut」
  const soldOutItem = labels?.soldOutItem ?? (labels?.soldOut ? (n: string) => `${n}, ${labels.soldOut}` : t.soldOutItem);
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState<VariantValue>(defaultValue ?? { color: colors[0]?.id });
  const current = value ?? inner;

  const qty = (c?: string, s?: string) => (c && s ? (stock[`${c}:${s}`] ?? 0) : 0);
  const colorSoldOut = (c: string) => sizes.every((s) => qty(c, s.id) <= 0);
  const colorName = colors.find((c) => c.id === current.color)?.name;
  const left = qty(current.color, current.size);

  function commit(next: VariantValue) {
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  // 換顏色時，原尺寸在新顏色售完就清掉，避免停在不能買的組合
  const pickColor = (id: string) => commit({ color: id, size: current.size && qty(id, current.size) > 0 ? current.size : undefined });
  const pickSize = (id: string) => commit({ ...current, size: id });

  return (
    <div className={cn("w-full max-w-sm space-y-5 font-sans", ink, className)}>
      <fieldset>
        <legend className="flex gap-2 text-sm">
          <span className={inkMuted}>{t.color}</span>
          <span className="font-medium">{colorName}</span>
        </legend>
        <RadioRow
          label={typeof t.color === "string" ? t.color : undefined}
          className="mt-2.5 flex flex-wrap gap-2.5"
          items={colors.map((c) => ({ id: c.id, disabled: colorSoldOut(c.id) }))}
          selected={current.color}
          onSelect={pickColor}
          render={(id, on, disabled) => {
            const c = colors.find((x) => x.id === id)!;
            return {
              label: disabled ? soldOutItem(c.name) : c.name,
              className: cn("relative grid size-9 place-items-center rounded-full border", on ? "border-current" : "border-transparent"),
              children: (
                <>
                  <span className={cn("size-7 rounded-full border", edge)} style={{ backgroundColor: c.swatch }} />
                  {disabled && <span aria-hidden="true" className="absolute h-px w-8 -rotate-45 bg-current opacity-60" />}
                </>
              ),
            };
          }}
          reduceMotion={!!reduceMotion}
        />
      </fieldset>

      <fieldset>
        <legend className={cn("text-sm", inkMuted)}>{t.size}</legend>
        <RadioRow
          label={typeof t.size === "string" ? t.size : undefined}
          className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2"
          items={sizes.map((s) => ({ id: s.id, disabled: qty(current.color, s.id) <= 0 }))}
          selected={current.size}
          onSelect={pickSize}
          render={(id, on, disabled) => {
            const s = sizes.find((x) => x.id === id)!;
            return {
              label: disabled ? soldOutItem(s.label) : s.label,
              className: cn("relative h-10 overflow-hidden rounded-md border text-sm font-medium tabular-nums", paper, on ? "border-current" : edge),
              children: (
                <>
                  <span className={cn("inline-block", disabled && "-translate-y-1.5 line-through opacity-50")}>{s.label}</span>
                  {disabled && (
                    // 售完：墨色淡化小章放在尺寸下方，不蓋住尺寸名稱（DESIGN.md 規定售完不用朱紅）
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-1 left-1/2 -translate-x-1/2 -rotate-[8deg] rounded-[2px] border border-current px-0.5 text-[8px] leading-[10px] font-bold tracking-[0.12em] whitespace-nowrap uppercase",
                        inkMuted,
                      )}
                    >
                      {t.soldOut}
                    </span>
                  )}
                </>
              ),
            };
          }}
          reduceMotion={!!reduceMotion}
        />
      </fieldset>

      <p className="text-sm tabular-nums" role="status" aria-live="polite">
        {!current.size ? (
          <span className={inkMuted}>{t.pickSize}</span>
        ) : left <= lowStockAt ? (
          <span className={cn("font-medium", vermilion)}>{t.lowStock(left)}</span>
        ) : (
          <span className="text-emerald-700 dark:text-emerald-400">{t.inStock}</span>
        )}
      </p>
    </div>
  );
}

interface RadioRowProps {
  items: { id: string; disabled: boolean }[];
  selected?: string;
  onSelect: (id: string) => void;
  render: (id: string, on: boolean, disabled: boolean) => { label: string; className: string; children: ReactNode };
  reduceMotion: boolean;
  label?: string;
  className?: string;
}

/** radiogroup：方向鍵在可選項目間移動並選取，售完項目略過但仍會被朗讀 */
function RadioRow({ items, selected, onSelect, render, reduceMotion, label, className }: RadioRowProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const sel = items.findIndex((it) => it.id === selected && !it.disabled);
  const tabStop = sel >= 0 ? sel : items.findIndex((it) => !it.disabled);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    for (let i = 1; i <= items.length; i++) {
      const next = (index + step * i + items.length) % items.length;
      if (!items[next].disabled) {
        refs.current[next]?.focus();
        onSelect(items[next].id);
        return;
      }
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {items.map((it, i) => {
        const on = it.id === selected;
        const r = render(it.id, on, it.disabled);
        return (
          <motion.button
            key={it.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={it.disabled || undefined}
            aria-label={r.label}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => !it.disabled && onSelect(it.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            whileTap={reduceMotion || it.disabled ? undefined : { scale: 0.94 }}
            transition={springs.snappy}
            className={cn(
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              it.disabled && "cursor-not-allowed",
              r.className,
            )}
          >
            {r.children}
          </motion.button>
        );
      })}
    </div>
  );
}
