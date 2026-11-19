"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ConsentItem {
  id: string;
  label: ReactNode;
  /** Supplementary note below the term, e.g. return period or how data is used */
  description?: ReactNode;
  /** Required: cannot submit without ticking it. Optional items are always unticked by default */
  required?: boolean;
}

export interface TermsConsentLabels {
  eyebrow?: ReactNode;
  required?: ReactNode;
  optional?: ReactNode;
  /** Required count, e.g. "1 / 2 required" */
  counter?: (done: number, total: number) => ReactNode;
  /** Reason shown when the button is disabled, read to screen readers through aria-describedby */
  blocked?: (missing: number) => ReactNode;
  ready?: ReactNode;
  /** Default button text; submitLabel takes priority */
  submit?: ReactNode;
}

export interface TermsConsentProps {
  items: ConsentItem[];
  /** Controlled: the ids currently ticked */
  value?: string[];
  defaultValue?: string[];
  onChange?: (checked: string[]) => void;
  /** Fires when the button is clicked after all required items are ticked; returns all ticked ids (including optional ones) */
  onSubmit?: (checked: string[]) => void;
  submitLabel?: ReactNode;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are accepted too */
  locale?: string;
  /** Override built-in strings; takes priority over locale */
  labels?: TermsConsentLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<TermsConsentLabels>> = {
  en: {
    eyebrow: "Before you pay",
    required: "Required",
    optional: "Optional",
    counter: (done, total) => <>{done} / {total} required</>,
    blocked: (missing) => <>Tick the {missing} required {missing === 1 ? "item" : "items"} above to continue.</>,
    ready: "All set. Optional items can stay unticked.",
    submit: "Place order",
  },
  "zh-TW": {
    eyebrow: "付款前確認",
    required: "必填",
    optional: "選填",
    counter: (done, total) => <>必填 {done} / {total}</>,
    blocked: (missing) => <>請勾選上方 {missing} 項必填項目後繼續。</>,
    ready: "已完成，選填項目可以不勾。",
    submit: "送出訂單",
  },
  "zh-CN": {
    eyebrow: "付款前确认",
    required: "必填",
    optional: "选填",
    counter: (done, total) => <>必填 {done} / {total}</>,
    blocked: (missing) => <>请勾选上方 {missing} 项必填项后继续。</>,
    ready: "已完成，选填项可以不勾选。",
    submit: "提交订单",
  },
  ja: {
    eyebrow: "お支払いの前に",
    required: "必須",
    optional: "任意",
    counter: (done, total) => <>必須 {done} / {total}</>,
    blocked: (missing) => <>続行するには、上の必須項目をあと {missing} 件チェックしてください。</>,
    ready: "準備完了です。任意の項目はチェックしなくてもかまいません。",
    submit: "注文を確定する",
  },
};

// Design language (DESIGN.md, craft quality): surface, hairline, text colours, brand accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
const vermilion = "text-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers, and current progress */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

/**
 * Terms consent before checkout: counts required items n / m, and the checkout button is enabled only when all are ticked.
 * While the button is disabled it uses aria-disabled (so it stays focusable) and explains why through aria-describedby.
 */
export function TermsConsent({
  items,
  value,
  defaultValue = [],
  onChange,
  onSubmit,
  submitLabel,
  locale = "en",
  labels,
  className,
}: TermsConsentProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const uid = useId();
  const [inner, setInner] = useState<string[]>(defaultValue);
  const checked = value ?? inner;

  const required = items.filter((i) => i.required);
  const done = required.filter((i) => checked.includes(i.id)).length;
  const ready = done === required.length;
  const hintId = `${uid}-hint`;

  function toggle(id: string) {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    if (value === undefined) setInner(next);
    onChange?.(next);
  }

  return (
    <section className={cn("w-full max-w-md rounded-xl border", surface, edge, ink, className)}>
      <header className={cn("flex items-baseline justify-between gap-3 border-b px-4 py-3", edge)}>
        <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.eyebrow}</p>
        <p className="text-xs font-medium tabular-nums" aria-hidden="true">
          {t.counter(done, required.length)}
        </p>
      </header>

      <ul className="divide-y divide-foreground/10">
        {items.map((item) => {
          const on = checked.includes(item.id);
          const inputId = `${uid}-${item.id}`;
          return (
            <li key={item.id}>
              <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3 px-4 py-3">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(item.id)}
                  aria-describedby={item.description ? `${inputId}-desc` : undefined}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                    on ? cn(spotBorder, spotFill) : "border-foreground/30",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <motion.path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sm leading-snug">
                    {item.label}{" "}
                    <span
                      className={cn(
                        "ml-0.5 align-middle text-[10px] font-medium tracking-[0.08em] whitespace-nowrap uppercase",
                        item.required ? vermilion : inkMuted,
                      )}
                    >
                      {item.required ? t.required : t.optional}
                    </span>
                  </span>
                  {item.description && (
                    <span id={`${inputId}-desc`} className={cn("mt-1 block text-xs leading-relaxed", inkMuted)}>
                      {item.description}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <footer className={cn("space-y-2 border-t px-4 py-3", edge)}>
        <button
          type="button"
          aria-disabled={!ready}
          aria-describedby={hintId}
          onClick={() => ready && onSubmit?.(checked)}
          className={cn(
            spotFill,
            "inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-[opacity,scale] outline-none motion-safe:active:scale-[0.97]",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !ready && "cursor-not-allowed opacity-45",
          )}
        >
          {submitLabel ?? t.submit}
        </button>
        <p id={hintId} role="status" aria-live="polite" className={cn("text-xs tabular-nums", inkMuted)}>
          {ready ? t.ready : t.blocked(required.length - done)}
        </p>
      </footer>
    </section>
  );
}
