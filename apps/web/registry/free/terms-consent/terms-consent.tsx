"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ConsentItem {
  id: string;
  label: ReactNode;
  /** 條款下方的補充說明，例如退貨天數或資料用途 */
  description?: ReactNode;
  /** 必填：沒勾就不能送出。選填項目一律預設不勾 */
  required?: boolean;
}

export interface TermsConsentLabels {
  eyebrow?: ReactNode;
  required?: ReactNode;
  optional?: ReactNode;
  /** 必填計數，例如「1 / 2 required」 */
  counter?: (done: number, total: number) => ReactNode;
  /** 按鈕停用時的原因，會透過 aria-describedby 讀給螢幕閱讀器 */
  blocked?: (missing: number) => ReactNode;
  ready?: ReactNode;
}

export interface TermsConsentProps {
  items: ConsentItem[];
  /** 受控：目前勾選的 id */
  value?: string[];
  defaultValue?: string[];
  onChange?: (checked: string[]) => void;
  /** 必填全勾後點按鈕觸發，回傳所有勾選的 id（含選填） */
  onSubmit?: (checked: string[]) => void;
  submitLabel?: ReactNode;
  labels?: TermsConsentLabels;
  className?: string;
}

const defaultLabels: Required<TermsConsentLabels> = {
  eyebrow: "Before you pay",
  required: "Required",
  optional: "Optional",
  counter: (done, total) => <>{done} / {total} required</>,
  blocked: (missing) => <>Tick the {missing} required {missing === 1 ? "item" : "items"} above to continue.</>,
  ready: "All set. Optional items can stay unticked.",
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

/**
 * 結帳前的條款同意：必填項目計數 n / m，全部勾完才啟用結帳按鈕。
 * 按鈕停用時用 aria-disabled（保留可聚焦），並以 aria-describedby 說明原因。
 */
export function TermsConsent({
  items,
  value,
  defaultValue = [],
  onChange,
  onSubmit,
  submitLabel = "Place order",
  labels,
  className,
}: TermsConsentProps) {
  const t = { ...defaultLabels, ...labels };
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
    <section className={cn("w-full max-w-md rounded-md border", paper, edge, ink, className)}>
      <header className={cn("flex items-baseline justify-between gap-3 border-b border-dashed px-4 py-3", edge)}>
        <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.eyebrow}</p>
        <p className="text-xs font-medium tabular-nums" aria-hidden="true">
          {t.counter(done, required.length)}
        </p>
      </header>

      <ul className="divide-y divide-dashed divide-[#e7e0d0] dark:divide-[#38332b]">
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
                    on ? "border-primary bg-primary text-primary-foreground" : "border-[#1c1917]/30 dark:border-[#ece7dc]/30",
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

      <footer className={cn("space-y-2 border-t border-dashed px-4 py-3", edge)}>
        <button
          type="button"
          aria-disabled={!ready}
          aria-describedby={hintId}
          onClick={() => ready && onSubmit?.(checked)}
          className={cn(
            "inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !ready && "cursor-not-allowed opacity-45",
          )}
        >
          {submitLabel}
        </button>
        <p id={hintId} role="status" aria-live="polite" className={cn("text-xs tabular-nums", inkMuted)}>
          {ready ? t.ready : t.blocked(required.length - done)}
        </p>
      </footer>
    </section>
  );
}
