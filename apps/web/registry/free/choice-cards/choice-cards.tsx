"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ChoiceOption {
  id: string;
  name: ReactNode;
  /** 一行說明，例如價格與到貨時間 */
  brief?: ReactNode;
  gains?: ReactNode[];
  costs?: ReactNode[];
  /** 選了之後會自動包含的項目 */
  includes?: { term: ReactNode; desc: ReactNode }[];
  /** 選中後顯示在卡片下方的說明 */
  meaning?: ReactNode;
  disabled?: boolean;
  reason?: ReactNode;
  recommended?: boolean;
}

export interface ChoiceCardsLabels {
  includes?: ReactNode;
  recommended?: ReactNode;
  gain?: string;
  cost?: string;
  unavailable?: ReactNode;
}

export interface ChoiceCardsProps {
  options: ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** radiogroup 的無障礙名稱 */
  label: string;
  labels?: ChoiceCardsLabels;
  className?: string;
}

const defaultLabels: Required<ChoiceCardsLabels> = {
  includes: "Includes automatically",
  recommended: "Recommended",
  gain: "Gain",
  cost: "Trade-off",
  unavailable: "Unavailable",
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

const cols: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2",
};

export function ChoiceCards({
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  label,
  labels,
  className,
}: ChoiceCardsProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.id === value && !o.disabled);
  // roving tabindex：已選的那張，沒有就第一張可選的
  const tabStop = selectedIndex >= 0 ? selectedIndex : (enabled[0] ?? -1);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const select = (i: number, focus = false) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (focus) refs.current[i]?.focus();
    if (o.id === value) return;
    if (valueProp === undefined) setInner(o.id);
    onValueChange?.(o.id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(i);
    let next: number | undefined;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = enabled[(pos + 1) % enabled.length];
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = enabled[(pos - 1 + enabled.length) % enabled.length];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled[enabled.length - 1];
        break;
      case " ":
      case "Enter":
        next = i;
        break;
      default:
        // 數字鍵 1..n 直接選對應的卡
        if (/^[1-9]$/.test(e.key) && Number(e.key) <= options.length) next = Number(e.key) - 1;
    }
    if (next === undefined) return;
    e.preventDefault();
    select(next, true);
  };

  return (
    <div className={cn("w-full font-sans", ink, className)}>
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={selected?.meaning ? `${id}-meaning` : undefined}
        className={cn("grid grid-cols-1 gap-3", cols[Math.min(options.length, 4)] ?? "sm:grid-cols-2")}
      >
        {options.map((o, i) => {
          const checked = i === selectedIndex;
          return (
            <motion.div
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={checked}
              aria-disabled={o.disabled || undefined}
              aria-describedby={o.disabled && o.reason ? `${id}-${o.id}-reason` : undefined}
              tabIndex={i === tabStop ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              animate={{ y: checked && !reduce ? -2 : 0 }}
              transition={reduce ? { duration: 0 } : springs.snappy}
              className={cn(
                "relative flex h-full cursor-pointer flex-col gap-3 rounded-md border p-4 text-left outline-none select-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                paper,
                checked ? "border-[#1c1917] ring-1 ring-[#1c1917] ring-inset dark:border-[#ece7dc] dark:ring-[#ece7dc]" : edge,
                o.disabled && "cursor-not-allowed",
              )}
            >
              <div className={cn("flex flex-col gap-3", o.disabled && "opacity-45")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight">{o.name}</p>
                    {o.brief && <p className={cn("mt-0.5 text-sm tabular-nums", inkMuted)}>{o.brief}</p>}
                  </div>
                  {o.recommended && !o.disabled && (
                    <span className={cn("shrink-0 pt-1 text-[10px] font-semibold tracking-[0.16em] uppercase", vermilion)}>
                      {t.recommended}
                    </span>
                  )}
                  <RadioMark checked={checked} />
                </div>

                {o.gains?.length || o.costs?.length ? (
                  <ul className="space-y-1 text-sm">
                    {o.gains?.map((g, k) => (
                      <li key={`g${k}`} className="flex items-start gap-2">
                        <PlusIcon />
                        <span className="sr-only">{t.gain}: </span>
                        <span>{g}</span>
                      </li>
                    ))}
                    {o.costs?.map((c, k) => (
                      <li key={`c${k}`} className={cn("flex items-start gap-2", inkMuted)}>
                        <MinusIcon />
                        <span className="sr-only">{t.cost}: </span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {o.includes?.length ? (
                  <div className={cn("border-t border-dashed pt-3", edge)}>
                    <p className={cn("text-[10px] font-medium tracking-[0.16em] uppercase", inkMuted)}>{t.includes}</p>
                    <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      {o.includes.map((it, k) => (
                        <div key={k} className="contents">
                          <dt className="font-medium">{it.term}</dt>
                          <dd className={inkMuted}>{it.desc}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </div>

              {o.disabled && (
                <p id={`${id}-${o.id}-reason`} className={cn("mt-auto text-xs", inkMuted)}>
                  <span className="font-medium">{t.unavailable}.</span> {o.reason}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <p id={`${id}-meaning`} aria-live="polite" className={cn("mt-3 min-h-5 text-sm", inkMuted)}>
        {selected?.meaning}
      </p>
    </div>
  );
}

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border",
        checked ? "border-[#1c1917] dark:border-[#ece7dc]" : "border-[#1c1917]/30 dark:border-[#ece7dc]/30",
      )}
    >
      {checked && <span className="size-2 rounded-full bg-[#1c1917] dark:bg-[#ece7dc]" />}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3.5 8h9" strokeLinecap="round" />
    </svg>
  );
}
