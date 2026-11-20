"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Result } from "@/components/ui/stamp";
import { instant, roll, springs } from "@/lib/sunui-motion";
import { cn } from "@/lib/utils";

export interface VariantColor {
  id: string;
  /** Color name, also used as the swatch aria-label */
  name: string;
  /** Swatch fill, e.g. "#d0d0d0" */
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

/** Second argument of onChange: whether the selected combination can currently be bought */
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
  /** Accessible name of a sold-out option */
  soldOutItem?: (name: string) => string;
  /** Accessible name of a sold-out option when onNotify is set */
  soldOutNotify?: (name: string) => string;
  /** "White M is sold out" */
  soldOutIn?: (size: string, color: string) => string;
  /** "M is still available in:", followed by colors that can be switched to */
  availableIn?: (size: string) => string;
  /** Restock notice button */
  notify?: (size: string) => string;
  /** Result after signing up for a restock notice */
  notified?: string;
}

export interface VariantPickerProps {
  colors: VariantColor[];
  sizes: VariantSize[];
  /** Stock for each combination, keyed by `${colorId}:${sizeId}`; combinations not listed count as sold out */
  stock: Record<string, number>;
  value?: VariantValue;
  defaultValue?: VariantValue;
  /** The size is kept when the color changes, even if it is sold out in the new color; use the second argument's available to decide whether it can be added to the cart */
  onChange?: (value: VariantValue, info: VariantChangeInfo) => void;
  /** When set, sold-out sizes are clickable and expand a "notify me" form in place */
  onNotify?: (value: { color: string; size: string }) => void;
  /** Shows "Mist grey · M · only 2 left" at the bottom; only the segment that changed scrolls */
  showSummary?: boolean;
  /** Show "N left" when stock is at or below this number */
  lowStockAt?: number;
  /** Size row style: stamp is a surface grid with small sold-out text; chips are text capsules with one text-colored outline that slides and a strikethrough for sold out */
  sizeStyle?: "stamp" | "chips";
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings; takes precedence over locale */
  labels?: VariantPickerLabels;
  className?: string;
}

export interface OptionChipsLabels {
  /** Name of the whole group when no aria-label is passed */
  group: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
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

// Design language (DESIGN.md, craft quality): surface, hairline and text colors, all neutral greys
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; set --sunui-spot to use your own brand color. Used only for selection, offers and current progress */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
// Previewing stock changes only opacity and strikethrough color, never the layout
const fade = "transition-[color,opacity,translate,text-decoration-color] duration-150 motion-reduce:transition-none";

/** Hover preview only on precise pointers such as a mouse; touch pointerenter does not count */
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
  // When only soldOut is overridden, the accessible name keeps the old "name, soldOut" format
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
  // Stock shown in the size row: while a color is hovered or focused, show that color's stock first
  const shown = peek ?? current.color;
  const left = qty(current.color, current.size);
  const kept = !!current.size && left <= 0;

  function commit(next: VariantValue) {
    if (value === undefined) setInner(next);
    onChange?.(next, { available: qty(next.color, next.size) > 0 });
  }

  // Keep the size when the color changes: mark it if it is sold out in the new color and list the colors that still have it, rather than clearing it silently
  const pickColor = (id: string) => commit({ color: id, size: current.size });
  const pickSize = (id: string) => {
    setNotifyFor(undefined);
    commit({ ...current, size: id });
  };
  const pressSoldOut = (id: string) => onNotify && setNotifyFor((f) => (f === id ? undefined : id));

  // Hint line: a sold-out size the user clicked comes first, then a size kept after a color change
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
                surface,
                // Selected but sold out in this color: the outline turns dashed, the selection stays
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
                  {/* Sold out: small pale text below the size so it does not cover the size name; always in the layout, it only fades in and out */}
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

/** Height follows the content (gentle spring) and content below slides along; when collapsing, the last content stays until the height reaches zero */
function Expand({ open, reduce, children }: { open: boolean; reduce: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const last = useRef<ReactNode>(null);
  // Use auto until the height is measured: when open from the start (e.g. a static card) it does not grow from 0
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

/** Sold-out hint: which colors still have this size (one click to switch) and the restock notice; the result takes the place of the original button */
function SoldOutNote({ text, alternatives, onAlternative, onNotify, done }: SoldOutNoteProps) {
  return (
    <div className={cn("mt-3 space-y-2 rounded-xl border p-3 text-sm", surface, edge)}>
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
                "inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium outline-none hover:border-current/40 motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]",
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
              <Result shape="tick" size="sm">{text.done}</Result>
              <span className="sr-only">{text.done}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onNotify}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border border-current/25 px-3 text-sm font-medium outline-none hover:border-current/60 motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]",
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

/** One segment of the summary: when the value changes the old one leaves upward and the new one enters from below; unchanged segments stay still */
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
  /** focusable: disabled but still focusable and clickable (sold out but can sign up for a restock notice) */
  items: { id: string; disabled: boolean; focusable?: boolean }[];
  selected?: string;
  onSelect: (id: string) => void;
  onPressDisabled?: (id: string) => void;
  /** Reports an item on hover or focus, and undefined on leave */
  onPeek?: (id: string | undefined) => void;
  render: (id: string, on: boolean, disabled: boolean) => { label: string; className: string; children: ReactNode };
  reduceMotion: boolean;
  label?: string;
  className?: string;
}

// Arrow keys move focus and select at the same time (standard radio behavior), Home/End jump to the ends, disabled items are skipped
const keyMap: Record<string, 1 | -1 | "first" | "last"> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: "first", End: "last", };

/** Roving focus shared by both option rows: items with skip set to true are not focused; the caller decides in onMove whether to select */
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

/** radiogroup: arrow keys move between selectable items and select them; sold-out items are skipped but still announced */
function RadioRow({ items, selected, onSelect, onPressDisabled, onPeek, render, reduceMotion, label, className }: RadioRowProps) {
  const skip = items.map((it) => it.disabled && !it.focusable);
  // Moving to a sold-out but focusable item only moves focus, it does not select
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

/* ───────── OptionChips (formerly segmented-control): text capsules, one text-colored outline slides between options ───────── */

export interface OptionChip<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Icon shown before the text, e.g. a color swatch */
  icon?: ReactNode;
  /** Name for screen readers when only the icon is shown */
  ariaLabel?: string;
  /** Disabled (e.g. sold out); the text is struck through */
  disabled?: boolean;
}

export interface OptionChipsProps<T extends string = string> {
  options: OptionChip<T>[];
  /** Controlled value; pass null for controlled with nothing selected */
  value?: T | null;
  /** Initial value when uncontrolled, defaults to the first available option */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** When set, disabled options stay focusable and clickable (they are not selected), e.g. to expand a restock notice when sold out */
  onDisabledPress?: (value: T) => void;
  size?: "sm" | "md" | "lg";
  /** Fill the parent's width, with options of equal width */
  fullWidth?: boolean;
  /** Show the icon only; the text becomes the aria-label */
  iconOnly?: boolean;
  /** Accessible name of the whole group */
  "aria-label"?: string;
  disabled?: boolean;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings; takes precedence over locale */
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

  // With nothing selected, make the first available item reachable with Tab
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
          // With onDisabledPress, disabled items use aria-disabled so they can still be focused and clicked
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
              {/* The single selection outline, sliding between options; it turns dashed when the selected item is sold out */}
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

/** Name of the old segmented-control, same as OptionChips */
export const SegmentedControl = OptionChips;
export type SegmentedOption<T extends string = string> = OptionChip<T>;
export type SegmentedControlProps<T extends string = string> = OptionChipsProps<T>;
export type SegmentedControlLabels = OptionChipsLabels;
