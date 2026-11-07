"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Stamp } from "@/components/ui/stamp";
import { instant, roll, springs } from "@/lib/sunui-motion";
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

/** onChange 的第二個參數：選中的組合現在買不買得到 */
export interface VariantChangeInfo {
  available: boolean;
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
  /** 有 onNotify 時售完選項的無障礙名稱 */
  soldOutNotify?: (name: string) => string;
  /** 「白色的 M 已售完」 */
  soldOutIn?: (size: string, color: string) => string;
  /** 「M 還有：」，後面接可切換的顏色 */
  availableIn?: (size: string) => string;
  /** 到貨通知按鈕 */
  notify?: (size: string) => string;
  /** 登記到貨通知之後的結果 */
  notified?: string;
}

export interface VariantPickerProps {
  colors: VariantColor[];
  sizes: VariantSize[];
  /** 每個組合的庫存，key 為 `${colorId}:${sizeId}`；沒列到視為售完 */
  stock: Record<string, number>;
  value?: VariantValue;
  defaultValue?: VariantValue;
  /** 換顏色時尺寸會保留，即使在新顏色售完；用第二個參數的 available 決定能不能加入購物車 */
  onChange?: (value: VariantValue, info: VariantChangeInfo) => void;
  /** 傳入時，售完的尺寸可以點，在原位展開「到貨通知我」 */
  onNotify?: (value: { color: string; size: string }) => void;
  /** 底部顯示「霧灰 · M · 只剩 2 件」，只有改到的那段會滾動 */
  showSummary?: boolean;
  /** 庫存小於等於此數字時顯示「剩 N 件」 */
  lowStockAt?: number;
  /** 尺寸列樣式：stamp 是紙面格子加售完小字；chips 是文字膠囊，一個墨色外框滑動、售完劃線 */
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
    color: "Colour", size: "Size", soldOut: "Sold out", inStock: "In stock",
    lowStock: (n) => <>Only {n} left</>,
    pickSize: "Select a size",
    soldOutItem: (name) => `${name}, sold out`,
    soldOutNotify: (name) => `${name}, sold out, notify available`,
    soldOutIn: (s, c) => `${s} is sold out in ${c}`,
    availableIn: (s) => `${s} is available in:`,
    notify: (s) => `Email me when ${s} is back`,
    notified: "We will email you", group: "Options",
  },
  "zh-TW": {
    color: "顏色", size: "尺寸", soldOut: "售完", inStock: "有現貨",
    lowStock: (n) => <>只剩 {n} 件</>,
    pickSize: "請選擇尺寸",
    soldOutItem: (name) => `${name}，售完`,
    soldOutNotify: (name) => `${name}，售完，可登記到貨通知`,
    soldOutIn: (s, c) => `${c}的 ${s} 已售完`,
    availableIn: (s) => `${s} 還有：`,
    notify: (s) => `${s} 到貨時寄信通知我`,
    notified: "到貨會寄信通知你", group: "選項",
  },
  "zh-CN": {
    color: "颜色", size: "尺码", soldOut: "售罄", inStock: "有现货",
    lowStock: (n) => <>仅剩 {n} 件</>,
    pickSize: "请选择尺码",
    soldOutItem: (name) => `${name}，售罄`,
    soldOutNotify: (name) => `${name}，售罄，可登记到货通知`,
    soldOutIn: (s, c) => `${c}的 ${s} 已售罄`,
    availableIn: (s) => `${s} 还有：`,
    notify: (s) => `${s} 到货时发邮件通知我`,
    notified: "到货后会发邮件通知你", group: "选项",
  },
  ja: {
    color: "カラー", size: "サイズ", soldOut: "売り切れ", inStock: "在庫あり",
    lowStock: (n) => <>残り {n} 点</>,
    pickSize: "サイズを選択してください",
    soldOutItem: (name) => `${name}、売り切れ`,
    soldOutNotify: (name) => `${name}、売り切れ、再入荷通知を受け取れます`,
    soldOutIn: (s, c) => `${c}の ${s} は売り切れです`,
    availableIn: (s) => `${s} の在庫があるカラー：`,
    notify: (s) => `${s} の再入荷をメールで受け取る`,
    notified: "再入荷したらメールでお知らせします", group: "オプション",
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨，全部是中性灰
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
// 預覽庫存時只動不透明度與刪除線顏色，不換版面
const fade = "transition-[color,opacity,translate,text-decoration-color] duration-150 motion-reduce:transition-none";

/** 只在滑鼠這類精準指標上懸停預覽；觸控的 pointerenter 不算 */
const finePointer = (e: { pointerType?: string }) =>
  e.pointerType !== "touch" && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

export function VariantPicker({
  colors,
  sizes,
  stock,
  value,
  defaultValue,
  onChange,
  onNotify,
  showSummary = false,
  lowStockAt = 3,
  sizeStyle = "stamp",
  locale = "en",
  labels,
  className,
}: VariantPickerProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  // 只覆寫 soldOut 時，無障礙名稱沿用舊格式「名稱, soldOut」
  const soldOutItem = labels?.soldOutItem ?? (labels?.soldOut ? (n: string) => `${n}, ${labels.soldOut}` : t.soldOutItem);
  const reduce = !!useReducedMotion();
  const [inner, setInner] = useState<VariantValue>(defaultValue ?? { color: colors[0]?.id });
  const [peek, setPeek] = useState<string>();
  const [notifyFor, setNotifyFor] = useState<string>();
  const [notified, setNotified] = useState<string[]>([]);
  const current = value ?? inner;

  const qty = (c?: string, s?: string) => (c && s ? (stock[`${c}:${s}`] ?? 0) : 0);
  const colorSoldOut = (c: string) => sizes.every((s) => qty(c, s.id) <= 0);
  const nameOf = (id?: string) => colors.find((c) => c.id === id)?.name ?? "";
  const labelOf = (id?: string) => sizes.find((s) => s.id === id)?.label ?? "";
  // 尺寸列顯示的庫存：懸停或聚焦某個顏色時先看那個顏色的
  const shown = peek ?? current.color;
  const left = qty(current.color, current.size);
  const kept = !!current.size && left <= 0;

  function commit(next: VariantValue) {
    if (value === undefined) setInner(next);
    onChange?.(next, { available: qty(next.color, next.size) > 0 });
  }

  // 換顏色時保留尺寸：在新顏色售完就標示出來，並列出還有這個尺寸的顏色，不默默清掉
  const pickColor = (id: string) => commit({ color: id, size: current.size });
  const pickSize = (id: string) => {
    setNotifyFor(undefined);
    commit({ ...current, size: id });
  };
  const pressSoldOut = (id: string) => onNotify && setNotifyFor((f) => (f === id ? undefined : id));

  // 提示行：點過的售完尺寸優先，其次是換顏色後保留下來的尺寸
  const noteSize = (notifyFor && qty(current.color, notifyFor) <= 0 ? notifyFor : undefined) ?? (kept ? current.size : undefined);
  const note = noteSize && current.color ? { size: noteSize, color: current.color } : undefined;
  const sizeName = (id: string, off: boolean) => (!off ? labelOf(id) : onNotify ? t.soldOutNotify(labelOf(id)) : soldOutItem(labelOf(id)));

  return (
    <div className={cn("w-full max-w-sm font-sans", ink, className)}>
      <fieldset>
        <legend className="flex gap-2 text-sm">
          <span className={inkMuted}>{t.color}</span>
          <span className="font-medium">{nameOf(shown)}</span>
        </legend>
        <RadioRow
          label={typeof t.color === "string" ? t.color : undefined}
          className="mt-2.5 flex flex-wrap gap-2.5"
          items={colors.map((c) => ({ id: c.id, disabled: colorSoldOut(c.id) }))}
          selected={current.color}
          onSelect={pickColor}
          onPeek={setPeek}
          render={(id, on, disabled) => {
            const c = colors.find((x) => x.id === id)!;
            return {
              label: disabled ? soldOutItem(c.name) : c.name,
              className: cn("relative grid size-9 place-items-center rounded-full border", on ? spotBorder : "border-transparent"),
              children: (
                <>
                  <span className={cn("size-7 rounded-full border", edge)} style={{ backgroundColor: c.swatch }} />
                  {disabled && <span aria-hidden="true" className="absolute h-px w-8 -rotate-45 bg-current opacity-60" />}
                </>
              ),
            };
          }}
          reduceMotion={reduce}
        />
      </fieldset>

      <fieldset className="mt-5">
        <legend className={cn("text-sm", inkMuted)}>{t.size}</legend>
        {sizeStyle === "chips" ? (
          <OptionChips
            aria-label={typeof t.size === "string" ? t.size : undefined}
            locale={locale}
            className="mt-2.5"
            value={current.size ?? null}
            onValueChange={pickSize}
            onDisabledPress={onNotify ? pressSoldOut : undefined}
            options={sizes.map((s) => {
              const off = qty(shown, s.id) <= 0;
              return { value: s.id, label: s.label, disabled: off, ariaLabel: off ? sizeName(s.id, true) : undefined };
            })}
          />
        ) : (
          <RadioRow
            label={typeof t.size === "string" ? t.size : undefined}
            className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2"
            items={sizes.map((s) => ({ id: s.id, disabled: qty(shown, s.id) <= 0, focusable: !!onNotify }))}
            selected={current.size}
            onSelect={pickSize}
            onPressDisabled={pressSoldOut}
            render={(id, on, off) => ({
              label: sizeName(id, off),
              className: cn(
                "relative h-10 overflow-hidden rounded-md border text-sm font-medium tabular-nums",
                paper,
                // 選中但這個顏色售完：外框改虛線，選擇還在
                on ? cn(spotBorder, off && "border-dashed") : edge,
              ),
              children: (
                <>
                  <span
                    className={cn(
                      "inline-block line-through decoration-1",
                      fade,
                      off ? "-translate-y-1.5 decoration-current opacity-50" : "decoration-transparent",
                    )}
                  >
                    {labelOf(id)}
                  </span>
                  {/* 售完：淡墨小字放在尺寸下方，不蓋住尺寸名稱；一直在版面裡，只淡入淡出 */}
                  <span
                    aria-hidden="true"
                    className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] leading-[10px] whitespace-nowrap", inkMuted, fade, !off && "opacity-0")}
                  >
                    {t.soldOut}
                  </span>
                </>
              ),
            })}
            reduceMotion={reduce}
          />
        )}
      </fieldset>

      <Expand open={!!note} reduce={reduce}>
        {note && (
          <SoldOutNote
            key={`${note.color}:${note.size}`}
            text={{
              line: t.soldOutIn(labelOf(note.size), nameOf(note.color)),
              alt: t.availableIn(labelOf(note.size)),
              notify: t.notify(labelOf(note.size)),
              done: t.notified,
            }}
            alternatives={colors.filter((c) => qty(c.id, note.size) > 0)}
            onAlternative={(id) => {
              setNotifyFor(undefined);
              commit({ color: id, size: note.size });
            }}
            done={notified.includes(`${note.color}:${note.size}`)}
            onNotify={
              onNotify &&
              (() => {
                onNotify(note as { color: string; size: string });
                setNotified((n) => [...n, `${note.color}:${note.size}`]);
              })
            }
          />
        )}
      </Expand>

      <p className="mt-5 text-sm tabular-nums" role="status" aria-live="polite">
        {showSummary ? (
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <Roll k={current.color ?? ""} reduce={reduce} className="font-medium">
              {nameOf(current.color)}
            </Roll>
            <span aria-hidden="true" className={inkMuted}>·</span>
            <Roll k={current.size ?? "-"} reduce={reduce} className={current.size ? "font-medium" : inkMuted}>
              {current.size ? labelOf(current.size) : t.pickSize}
            </Roll>
            {current.size && (
              <>
                <span aria-hidden="true" className={inkMuted}>·</span>
                <Roll k={kept ? "out" : left <= lowStockAt ? `low${left}` : "in"} reduce={reduce} className={kept ? inkMuted : undefined}>
                  {kept ? t.soldOut : left <= lowStockAt ? t.lowStock(left) : t.inStock}
                </Roll>
              </>
            )}
          </span>
        ) : !current.size ? (
          <span className={inkMuted}>{t.pickSize}</span>
        ) : kept ? (
          <span className={inkMuted}>
            {t.soldOut}
            <span className="sr-only">: {t.soldOutIn(labelOf(current.size), nameOf(current.color))}</span>
          </span>
        ) : left <= lowStockAt ? (
          <span className="font-medium">{t.lowStock(left)}</span>
        ) : (
          <span className="text-emerald-700 dark:text-emerald-400">{t.inStock}</span>
        )}
      </p>
    </div>
  );
}

/** 高度跟著內容走（gentle 彈簧），下方內容一起滑動；收起時保留最後的內容直到高度歸零 */
function Expand({ open, reduce, children }: { open: boolean; reduce: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const last = useRef<ReactNode>(null);
  // 量到高度之前用 auto：一開始就展開時（例如靜態卡片）不會從 0 長出來
  const [h, setH] = useState<number | null>(null);
  if (open) last.current = children;
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? (h ?? "auto") : 0, opacity: open ? 1 : 0 }}
      transition={reduce || h === null ? instant : springs.gentle}
      className="overflow-hidden"
      inert={!open}
    >
      <div ref={box}>{open ? children : last.current}</div>
    </motion.div>
  );
}

interface SoldOutNoteProps {
  text: { line: string; alt: string; notify: string; done: string };
  alternatives: VariantColor[];
  onAlternative: (id: string) => void;
  onNotify?: () => void;
  done: boolean;
}

/** 售完提示：哪個顏色還有這個尺寸（一鍵切過去），以及到貨通知；結果放在原本按鈕的位置 */
function SoldOutNote({ text, alternatives, onAlternative, onNotify, done }: SoldOutNoteProps) {
  return (
    <div className={cn("mt-3 space-y-2 rounded-md border p-3 text-sm", paper, edge)}>
      <p className="font-medium">{text.line}</p>
      {alternatives.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={inkMuted}>{text.alt}</span>
          {alternatives.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onAlternative(c.id)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium outline-none hover:border-current/40",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                edge,
              )}
            >
              <span aria-hidden="true" className={cn("size-3 rounded-full border", edge)} style={{ backgroundColor: c.swatch }} />
              {c.name}
            </button>
          ))}
        </div>
      )}
      {onNotify && (
        <div className="flex min-h-9 items-center">
          {done ? (
            <span role="status">
              <Stamp shape="tick" size="sm">{text.done}</Stamp>
              <span className="sr-only">{text.done}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onNotify}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border border-current/25 px-3 text-sm font-medium outline-none hover:border-current/60",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              )}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.25" />
                <path d="m2.25 4 5.75 4.5L13.75 4" strokeLinecap="round" />
              </svg>
              {text.notify}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** 摘要的一段：值改變時舊值往上離開、新值從下面進來；沒變的段落不動 */
function Roll({ k, reduce, className, children }: { k: string; reduce: boolean; className?: string; children: ReactNode }) {
  if (reduce) return <span className={className}>{children}</span>;
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout" custom={1}>
        <motion.span key={k} custom={1} variants={roll} initial="enter" animate="center" exit="exit" className={cn("inline-block whitespace-nowrap", className)}>
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface RadioRowProps {
  /** focusable：停用但仍可聚焦、可點（售完但能登記到貨通知） */
  items: { id: string; disabled: boolean; focusable?: boolean }[];
  selected?: string;
  onSelect: (id: string) => void;
  onPressDisabled?: (id: string) => void;
  /** 懸停或聚焦某一項時回報它，離開時回報 undefined */
  onPeek?: (id: string | undefined) => void;
  render: (id: string, on: boolean, disabled: boolean) => { label: string; className: string; children: ReactNode };
  reduceMotion: boolean;
  label?: string;
  className?: string;
}

// 方向鍵移動焦點並同時選取（radio 的標準行為），Home／End 到頭尾，跳過停用項
const keyMap: Record<string, 1 | -1 | "first" | "last"> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: "first", End: "last", };

/** 兩種選項列共用的 roving focus：skip 為 true 的項目不會被聚焦；onMove 由呼叫端決定要不要選取 */
function useRovingRadio(skip: boolean[], onMove: (index: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent, from: number) => {
    const dir = keyMap[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    const n = skip.length;
    let i = dir === "first" ? -1 : dir === "last" ? n : from;
    const step = dir === "first" ? 1 : dir === "last" ? -1 : dir;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (!skip[i]) {
        refs.current[i]?.focus();
        onMove(i);
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
function RadioRow({ items, selected, onSelect, onPressDisabled, onPeek, render, reduceMotion, label, className }: RadioRowProps) {
  const skip = items.map((it) => it.disabled && !it.focusable);
  // 移到售完但可聚焦的項目只移焦點，不選取
  const roving = useRovingRadio(skip, (i) => !items[i].disabled && onSelect(items[i].id));
  const sel = items.findIndex((it, i) => it.id === selected && !skip[i]);
  const tabStop = sel >= 0 ? sel : items.findIndex((it) => !it.disabled);

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {items.map((it, i) => {
        const on = it.id === selected;
        const r = render(it.id, on, it.disabled);
        const pressable = !it.disabled || (it.focusable && onPressDisabled);
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
            onClick={() => (it.disabled ? it.focusable && onPressDisabled?.(it.id) : onSelect(it.id))}
            onKeyDown={(e) => roving.onKeyDown(e, i)}
            onPointerEnter={onPeek && ((e) => finePointer(e) && onPeek(it.id))}
            onPointerLeave={onPeek && (() => onPeek(undefined))}
            onFocus={onPeek && (() => onPeek(it.id))}
            onBlur={onPeek && (() => onPeek(undefined))}
            whileTap={reduceMotion || !pressable ? undefined : { scale: 0.94 }}
            transition={springs.snappy}
            className={cn(
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              !pressable && "cursor-not-allowed",
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
  /** 傳入時，停用的選項仍可聚焦與點擊（不會被選取），例如售完時展開到貨通知 */
  onDisabledPress?: (value: T) => void;
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
  onDisabledPress,
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
    options.map((o) => !!o.disabled && !onDisabledPress),
    (i) => !options[i].disabled && select(options[i].value),
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
          const off = disabled || !!o.disabled;
          // 有 onDisabledPress 時停用項用 aria-disabled，才能聚焦與點擊
          const soft = !disabled && !!o.disabled && !!onDisabledPress;
          return (
            <button
              key={o.value}
              ref={roving.setRef(i)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={iconOnly ? (o.ariaLabel ?? (typeof o.label === "string" ? o.label : undefined)) : o.ariaLabel}
              disabled={off && !soft}
              aria-disabled={soft || undefined}
              tabIndex={o.value === tabStop ? 0 : -1}
              onClick={() => (soft ? onDisabledPress?.(o.value) : select(o.value))}
              onKeyDown={(e) => roving.onKeyDown(e, i)}
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-md border border-border font-medium whitespace-nowrap tabular-nums outline-none select-none",
                "line-through decoration-1 transition-[color,border-color,text-decoration-color] duration-150 motion-reduce:transition-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                iconOnly ? s.iconOnly : s.item,
                s.icon,
                fullWidth && "flex-1",
                off
                  ? cn("text-current/35 decoration-current", soft ? "cursor-pointer" : "cursor-not-allowed")
                  : cn("decoration-transparent", active ? "text-current" : "text-current/70 hover:border-current/40 hover:text-current"),
              )}
            >
              {/* 唯一一個選取外框，在選項之間滑動；選中的項目售完時改成虛線 */}
              {active && (
                <motion.span
                  layoutId="variant-outline"
                  aria-hidden="true"
                  className={cn("pointer-events-none absolute -inset-px rounded-[inherit] border-[1.5px]", spotBorder, off && "border-dashed")}
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
