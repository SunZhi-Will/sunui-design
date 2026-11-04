"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SettlementPerson {
  id: string;
  name: string;
  lines: { label: string; amount: number }[];
  /** 先墊付整筆帳單的人 */
  paid?: boolean;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementReceiptLabels {
  paid?: ReactNode;
  balanced?: ReactNode;
  mismatch?: (diff: string) => ReactNode;
  transfers?: ReactNode;
  markSent?: (from: string, to: string, amount: string) => string;
  stamp?: ReactNode;
  total?: ReactNode;
  copy?: ReactNode;
  copied?: ReactNode;
  copyFailed?: string;
  settledAnnouncement?: string;
}

export interface SettlementReceiptProps {
  title?: ReactNode;
  date?: ReactNode;
  receiptNo?: string;
  people: SettlementPerson[];
  transfers?: SettlementTransfer[];
  /** 帳單總額，用來核對每人小計加總 */
  total: number;
  locale?: string;
  currency?: string;
  settled?: boolean;
  defaultSettled?: boolean;
  onSettledChange?: (settled: boolean) => void;
  onCopy?: (text: string) => void;
  labels?: SettlementReceiptLabels;
  className?: string;
}

const defaultLabels: Required<SettlementReceiptLabels> = {
  paid: "Paid",
  balanced: "Adds up to the bill",
  mismatch: (diff) => <>Off by {diff}</>,
  transfers: "Who pays whom",
  markSent: (from, to, amount) => `${from} sent ${amount} to ${to}`,
  stamp: "Settled",
  total: "Total",
  copy: "Copy summary",
  copied: "Copied",
  copyFailed: "Copy failed. Select the receipt text to copy it manually.",
  settledAnnouncement: "Every transfer is sent. Bill settled.",
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

/** 收據底部的撕紙鋸齒 */
const ZIG = 8;
const torn: CSSProperties = (() => {
  const mask = `linear-gradient(#000 0 0) top / 100% calc(100% - ${ZIG}px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${ZIG * 2}px ${ZIG}px repeat-x`;
  return { maskImage: mask, WebkitMaskImage: mask };
})();

export function SettlementReceipt({
  title = "Dinner split",
  date,
  receiptNo,
  people,
  transfers = [],
  total,
  locale = "en-US",
  currency = "USD",
  settled: settledProp,
  defaultSettled = false,
  onSettledChange,
  onCopy,
  labels,
  className,
}: SettlementReceiptProps) {
  const t = { ...defaultLabels, ...labels };
  const reduceMotion = useReducedMotion();
  const [sent, setSent] = useState<boolean[]>(() => transfers.map(() => defaultSettled));
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const isSent = (i: number) => settledProp ?? sent[i] ?? false;
  const settled = settledProp ?? (transfers.length > 0 && transfers.every((_, i) => sent[i]));

  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 });
  const money = (n: number) => fmt.format(n);
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  const subtotal = (p: SettlementPerson) => p.lines.reduce((s, l) => s + l.amount, 0);
  const diff = Math.round((people.reduce((s, p) => s + subtotal(p), 0) - total) * 100) / 100;

  function toggle(i: number) {
    if (settledProp !== undefined) return;
    const next = sent.map((v, j) => (j === i ? !v : v));
    setSent(next);
    const all = next.every(Boolean);
    if (all !== settled) {
      onSettledChange?.(all);
      if (all) setAnnouncement(t.settledAnnouncement);
    }
  }

  async function copy() {
    const text = [
      receiptNo ? `${typeof title === "string" ? title : ""} #${receiptNo}`.trim() : typeof title === "string" ? title : "",
      ...people.map((p) => `${p.name}: ${money(subtotal(p))}`),
      ...transfers.map((tr) => `${name(tr.from)} -> ${name(tr.to)} ${money(tr.amount)}`),
      `Total ${money(total)}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setAnnouncement(t.copyFailed);
    }
  }

  return (
    <div className={cn("relative w-full max-w-sm min-w-[17rem] font-sans", ink, className)}>
      <div className={cn("rounded-t-md border border-b-0 px-5 pt-5 pb-7", paper, edge)} style={torn}>
        <header className={cn("border-b border-dashed pb-3 text-center", edge)}>
          <p className="text-base font-semibold tracking-tight">{title}</p>
          <p className={cn("mt-1 flex justify-center gap-3 text-xs tabular-nums", inkMuted)}>
            {date && <span>{date}</span>}
            {receiptNo && <span className="font-mono tracking-[0.12em]">#{receiptNo}</span>}
          </p>
        </header>

        <ul className={cn("divide-y divide-dashed border-b border-dashed", edge, "divide-[#e7e0d0] dark:divide-[#38332b]")}>
          {people.map((p) => (
            <li key={p.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {p.name}
                  {p.paid && (
                    <span className={cn("rounded-[3px] border px-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase", edge, inkMuted)}>
                      {t.paid}
                    </span>
                  )}
                </p>
                <p className={cn("mt-0.5 text-xs leading-5 tabular-nums", inkMuted)}>
                  {p.lines.map((l) => `${l.label} ${new Intl.NumberFormat(locale).format(l.amount)}`).join(" · ")}
                </p>
              </div>
              <span className="text-base font-semibold tracking-tight tabular-nums">{money(subtotal(p))}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 py-3 text-sm">
          <span className="flex items-center gap-1.5 text-xs">
            {diff === 0 ? (
              <>
                <CheckIcon className="text-emerald-700 dark:text-emerald-400" />
                <span className={inkMuted}>{t.balanced}</span>
              </>
            ) : (
              <span className="text-destructive">{t.mismatch(money(Math.abs(diff)))}</span>
            )}
          </span>
          <span className="flex items-baseline gap-2">
            <span className={cn("text-xs uppercase tracking-[0.14em]", inkMuted)}>{t.total}</span>
            <span className="text-lg font-semibold tracking-tight tabular-nums">{money(total)}</span>
          </span>
        </div>

        {transfers.length > 0 && (
          <div className={cn("border-t border-dashed pt-3", edge)}>
            <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.transfers}</p>
            <ul className="mt-2 space-y-1">
              {transfers.map((tr, i) => {
                const on = isSent(i);
                return (
                  <li key={`${tr.from}-${tr.to}-${i}`}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={t.markSent(name(tr.from), name(tr.to), money(tr.amount))}
                      onClick={() => toggle(i)}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-current/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span aria-hidden="true" className={cn("grid size-4 shrink-0 place-items-center rounded-[3px] border", on ? "border-current" : edge)}>
                        {on && <CheckIcon />}
                      </span>
                      <span className={cn("flex-1 text-left", on && cn("line-through", inkMuted))}>
                        {name(tr.from)} <span aria-hidden="true">→</span> {name(tr.to)}
                      </span>
                      <span className={cn("font-medium tabular-nums", on && inkMuted)}>{money(tr.amount)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <motion.button
          type="button"
          onClick={copy}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={springs.snappy}
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-medium hover:bg-current/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            edge,
          )}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? t.copied : t.copy}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {settled && (
          <motion.span
            key="stamp"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-3 right-3 rounded-[3px] border-2 border-current px-2 py-0.5 text-sm font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              vermilion,
            )}
            initial={reduceMotion ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.15 } }}
            transition={springs.stamp}
          >
            {t.stamp}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m3 8.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
      <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5" />
    </svg>
  );
}
