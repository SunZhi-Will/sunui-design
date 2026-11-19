"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ShippingOption {
  id: string;
  /** Shipping method, e.g. "Home delivery" or "Convenience store pickup" */
  name: ReactNode;
  /** Estimated arrival, e.g. "Thu, Nov 7" or "2 to 3 business days" */
  eta: ReactNode;
  /** Shipping fee; 0 is shown as free shipping */
  fee: number;
  /** Small supplementary text, e.g. carrier or pickup instructions */
  note?: ReactNode;
  disabled?: boolean;
}

export interface ShippingOptionsProps {
  options: ShippingOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Accessible name of the radiogroup */
  label?: string;
  /** UI language and currency format: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are accepted too */
  locale?: string;
  currency?: string;
  freeLabel?: ReactNode;
  etaLabel?: ReactNode;
  /** Override built-in strings; takes priority over locale; label, freeLabel and etaLabel take priority over this */
  labels?: Partial<ShippingOptionsLabels>;
  className?: string;
}

export interface ShippingOptionsLabels {
  label: string;
  free: ReactNode;
  eta: ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
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

// Design language (DESIGN.md, craft quality): surface, hairline, text colours, brand accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers, and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

/** Width of the left column (shipping method and selection ring) */
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

  // roving tabindex: the selected card can be tabbed into; when none is selected, the first available one
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
            {/* The surface is its own layer, so selection only changes the edge colour and the focus ring is unaffected */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 -z-10 rounded-xl border",
                surface,
                on ? spotBorder : edge,
                !on && !o.disabled && "group-hover:border-foreground/30",
              )}
            />
            {/* Left column: shipping method and selection ring */}
            <span className="flex shrink-0 flex-col justify-between gap-2 px-3 py-3" style={{ width: STUB }}>
              <Dot on={on} reduceMotion={!!reduceMotion} />
              <span className="text-sm leading-tight font-semibold tracking-tight">{o.name}</span>
            </span>
            <span aria-hidden="true" className={cn("my-2 border-l", on ? "border-current/40" : edge)} />
            {/* Right column: arrival date and shipping fee */}
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

/** Selection ring: when selected, the center dot presses in with a snappy spring */
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
