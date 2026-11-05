"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface VariantColor {
  id: string;
  /** 顏色名稱，同時作為色票的 aria-label */
  name: string;
  /** 色票填色，例如 "#d0d0d0" */
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
  /** 尺寸列樣式：stamp 是紙面格子加售完小章；chips 是文字膠囊，一個墨色外框滑動、售完劃線 */
  sizeStyle?: "stamp" | "chips";
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: VariantPickerLabels;
  className?: string;
}

export interface OptionChipsLabels {
  /** 沒有傳 aria-label 時整組的名稱 */
  group: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<VariantPickerLabels> & OptionChipsLabels> = {
  en: {
    color: "Colour",
    size: "Size",
    soldOut: "Sold out",
    inStock: "In stock",
    lowStock: (n) => <>Only {n} left</>,
    pickSize: "Select a size",
    soldOutItem: (name) => `${name}, sold out`,
    group: "Options",
  },
  "zh-TW": {
    color: "顏色",
    size: "尺寸",
    soldOut: "售完",
    inStock: "有現貨",
    lowStock: (n) => <>只剩 {n} 件</>,
    pickSize: "請選擇尺寸",
    soldOutItem: (name) => `${name}，售完`,
    group: "選項",
  },
  "zh-CN": {
    color: "颜色",
    size: "尺码",
    soldOut: "售罄",
    inStock: "有现货",
    lowStock: (n) => <>仅剩 {n} 件</>,
    pickSize: "请选择尺码",
    soldOutItem: (name) => `${name}，售罄`,
    group: "选项",
  },
  ja: {
    color: "カラー",
    size: "サイズ",
    soldOut: "売り切れ",
    inStock: "在庫あり",
    lowStock: (n) => <>残り {n} 点</>,
    pickSize: "サイズを選択してください",
    soldOutItem: (name) => `${name}、売り切れ`,
    group: "オプション",
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
const vermilion = "text-[#171717] dark:text-[#ededed]";

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
  sizeStyle = "stamp",
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
        {sizeStyle === "chips" ? (
          <OptionChips
            aria-label={typeof t.size === "string" ? t.size : undefined}
            locale={locale}
            className="mt-2.5"
            value={current.size ?? null}
            onValueChange={pickSize}
            options={sizes.map((s) => {
              const soldOut = qty(current.color, s.id) <= 0;
              return { value: s.id, label: s.label, disabled: soldOut, ariaLabel: soldOut ? soldOutItem(s.label) : undefined };
            })}
          />
        ) : (
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
        )}
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

// 方向鍵移動焦點並同時選取（radio 的標準行為），Home／End 到頭尾，跳過停用項
const keyMap: Record<string, 1 | -1 | "first" | "last"> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  Home: "first",
  End: "last",
};

/** 兩種選項列共用的 roving focus：回傳 ref 收集器與 keydown 處理 */
function useRovingRadio(disabled: boolean[], onSelect: (index: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent, from: number) => {
    const dir = keyMap[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    const n = disabled.length;
    let i = dir === "first" ? -1 : dir === "last" ? n : from;
    const step = dir === "first" ? 1 : dir === "last" ? -1 : dir;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (!disabled[i]) {
        refs.current[i]?.focus();
        onSelect(i);
        return;
      }
    }
  };
  const setRef = (i: number) => (el: HTMLButtonElement | null) => {
    refs.current[i] = el;
  };
  return { setRef, onKeyDown };
}

/** radiogroup：方向鍵在可選項目間移動並選取，售完項目略過但仍會被朗讀 */
function RadioRow({ items, selected, onSelect, render, reduceMotion, label, className }: RadioRowProps) {
  const roving = useRovingRadio(
    items.map((it) => it.disabled),
    (i) => onSelect(items[i].id),
  );
  const sel = items.findIndex((it) => it.id === selected && !it.disabled);
  const tabStop = sel >= 0 ? sel : items.findIndex((it) => !it.disabled);

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {items.map((it, i) => {
        const on = it.id === selected;
        const r = render(it.id, on, it.disabled);
        return (
          <motion.button
            key={it.id}
            ref={roving.setRef(i)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={it.disabled || undefined}
            aria-label={r.label}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => !it.disabled && onSelect(it.id)}
            onKeyDown={(e) => roving.onKeyDown(e, i)}
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

/* ───────── OptionChips（原 segmented-control）：文字膠囊，一個墨色外框在選項間滑動 ───────── */

export interface OptionChip<T extends string = string> {
  value: T;
  label: ReactNode;
  /** 顯示在文字前的圖示，例如顏色色票 */
  icon?: ReactNode;
  /** 只顯示圖示時，提供給螢幕閱讀器的名稱 */
  ariaLabel?: string;
  /** 停用（例如售完），文字會劃線 */
  disabled?: boolean;
}

export interface OptionChipsProps<T extends string = string> {
  options: OptionChip<T>[];
  /** 受控值；傳 null 表示受控且目前沒有選取 */
  value?: T | null;
  /** 非受控時的初始值，預設為第一個可用選項 */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  size?: "sm" | "md" | "lg";
  /** 撐滿父層寬度，各選項等寬 */
  fullWidth?: boolean;
  /** 只顯示圖示，文字改為 aria-label */
  iconOnly?: boolean;
  /** 整組的無障礙名稱 */
  "aria-label"?: string;
  disabled?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<OptionChipsLabels>;
  className?: string;
}

const chipSizes = {
  sm: { item: "h-8 min-w-9 px-2.5 gap-1.5 text-xs", icon: "[&_svg]:size-3.5", iconOnly: "size-8" },
  md: { item: "h-10 min-w-11 px-3.5 gap-2 text-sm", icon: "[&_svg]:size-4", iconOnly: "size-10" },
  lg: { item: "h-12 min-w-14 px-5 gap-2 text-base", icon: "[&_svg]:size-5", iconOnly: "size-12" },
};

export function OptionChips<T extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  fullWidth = false,
  iconOnly = false,
  "aria-label": ariaLabelProp,
  disabled = false,
  locale = "en",
  labels,
  className,
}: OptionChipsProps<T>) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const firstEnabled = options.find((o) => !o.disabled)?.value;
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? firstEnabled);
  const selected = value === undefined ? inner : (value ?? undefined);
  const s = chipSizes[size];

  const select = (next: T) => {
    if (disabled) return;
    if (value === undefined) setInner(next);
    if (next !== selected) onValueChange?.(next);
  };
  const roving = useRovingRadio(
    options.map((o) => !!o.disabled),
    (i) => select(options[i].value),
  );

  // 沒有任何選取時，讓第一個可用項可被 Tab 聚焦
  const tabStop = options.some((o) => o.value === selected && !o.disabled) ? selected : firstEnabled;

  return (
    <LayoutGroup id={groupId}>
      <div
        role="radiogroup"
        aria-label={ariaLabelProp ?? t.group}
        aria-disabled={disabled || undefined}
        className={cn(
          "flex-wrap gap-2",
          fullWidth ? "flex w-full" : "inline-flex",
          ink,
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {options.map((o, i) => {
          const active = o.value === selected;
          return (
            <button
              key={o.value}
              ref={roving.setRef(i)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={iconOnly ? (o.ariaLabel ?? (typeof o.label === "string" ? o.label : undefined)) : o.ariaLabel}
              disabled={disabled || o.disabled}
              tabIndex={o.value === tabStop ? 0 : -1}
              onClick={() => select(o.value)}
              onKeyDown={(e) => roving.onKeyDown(e, i)}
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-md border border-border font-medium whitespace-nowrap tabular-nums transition-colors outline-none select-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:text-current/35 disabled:line-through disabled:decoration-1",
                iconOnly ? s.iconOnly : s.item,
                s.icon,
                fullWidth && "flex-1",
                active ? "text-current" : "text-current/70 enabled:hover:border-current/40 enabled:hover:text-current",
              )}
            >
              {/* 唯一一個選取外框，在選項之間滑動 */}
              {active && (
                <motion.span
                  layoutId="variant-outline"
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-px rounded-[inherit] border-[1.5px] border-current"
                  transition={reduceMotion ? { duration: 0 } : springs.snappy}
                />
              )}
              {o.icon && (
                <span aria-hidden="true" className="inline-flex shrink-0">
                  {o.icon}
                </span>
              )}
              {!iconOnly && <span>{o.label}</span>}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/** 舊 segmented-control 的名稱，與 OptionChips 相同 */
export const SegmentedControl = OptionChips;
export type SegmentedOption<T extends string = string> = OptionChip<T>;
export type SegmentedControlProps<T extends string = string> = OptionChipsProps<T>;
export type SegmentedControlLabels = OptionChipsLabels;
