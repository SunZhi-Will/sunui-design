"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SplitPerson {
  id: string;
  name: string;
}

export interface SplitItem {
  id: string;
  name: string;
  amount: number;
  /** 分攤這一項的成員 id */
  sharedBy: string[];
}

export interface BillSplitRowsLabels {
  itemName?: string;
  amount?: string;
  sharedBy?: string;
  all?: ReactNode;
  addItem?: ReactNode;
  remove?: ReactNode;
  newItem?: string;
  perPerson?: (count: number, each: string, exact: boolean) => ReactNode;
  leftover?: (amount: string, name: string) => ReactNode;
  noOne?: ReactNode;
  invalidAmount?: ReactNode;
  itemsTotal?: ReactNode;
  billTotal?: ReactNode;
  matches?: ReactNode;
  difference?: (amount: string, over: boolean) => ReactNode;
}

export interface BillSplitRowsProps {
  people: SplitPerson[];
  items?: SplitItem[];
  defaultItems?: SplitItem[];
  onItemsChange?: (items: SplitItem[]) => void;
  /** 帳單上的總額，用來和品項合計對帳 */
  billTotal?: number;
  currency?: string;
  locale?: string;
  labels?: BillSplitRowsLabels;
  className?: string;
}

const defaultLabels: Required<BillSplitRowsLabels> = {
  itemName: "Item name",
  amount: "Amount",
  sharedBy: "Shared by",
  all: "All",
  addItem: "Add item",
  remove: "Remove",
  newItem: "New item",
  perPerson: (n, each, exact) => (
    <>
      {n} {n === 1 ? "person" : "people"} · {exact ? "" : "about "}
      {each} each
    </>
  ),
  leftover: (amount, name) => <>{amount} left over goes to {name}</>,
  noOne: "Pick who shared this item.",
  invalidAmount: "Enter an amount, like 12.50.",
  itemsTotal: "Items total",
  billTotal: "Bill total",
  matches: "Matches the bill",
  difference: (amount, over) => <>{amount} {over ? "more than" : "short of"} the bill</>,
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const inkFill = "bg-[#1c1917] text-[#faf7f0] dark:bg-[#ece7dc] dark:text-[#1f1c18]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 依 id 算出固定色相，只用在小圓點上 */
export function personHue(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
}

export function BillSplitRows({
  people,
  items: itemsProp,
  defaultItems = [],
  onItemsChange,
  billTotal,
  currency = "USD",
  locale = "en-US",
  labels,
  className,
}: BillSplitRowsProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const uid = useId();
  const counter = useRef(0);
  const [inner, setInner] = useState(defaultItems);
  const items = itemsProp ?? inner;
  // 金額輸入中的草稿；無效時保留原字串並提示
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
  const unit = 10 ** (fmt.resolvedOptions().maximumFractionDigits ?? 2);
  const money = (units: number) => fmt.format(units / unit);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? id;

  const commit = (next: SplitItem[]) => {
    if (itemsProp === undefined) setInner(next);
    onItemsChange?.(next);
  };
  const patch = (id: string, change: Partial<SplitItem>) => commit(items.map((it) => (it.id === id ? { ...it, ...change } : it)));

  const setAmount = (id: string, raw: string) => {
    setDrafts((d) => ({ ...d, [id]: raw }));
    const n = Number(raw.replace(/,/g, ""));
    if (raw.trim() !== "" && Number.isFinite(n) && n >= 0) patch(id, { amount: n });
  };

  const isInvalid = (it: SplitItem) => {
    const d = drafts[it.id];
    if (d === undefined) return !Number.isFinite(it.amount) || it.amount < 0;
    const n = Number(d.replace(/,/g, ""));
    return d.trim() === "" || !Number.isFinite(n) || n < 0;
  };

  const add = () => {
    counter.current += 1;
    commit([...items, { id: `${uid}-${counter.current}`, name: t.newItem, amount: 0, sharedBy: people.map((p) => p.id) }]);
  };

  const validUnits = items.reduce((sum, it) => (isInvalid(it) ? sum : sum + Math.round(it.amount * unit)), 0);
  const billUnits = billTotal === undefined ? null : Math.round(billTotal * unit);
  const diff = billUnits === null ? 0 : validUnits - billUnits;

  return (
    <div className={cn("w-full rounded-md border font-sans", paper, edge, ink, className)}>
      <ul className={cn("divide-y divide-dashed px-4", "divide-[#e7e0d0] dark:divide-[#38332b]")}>
        <AnimatePresence initial={false}>
          {items.map((it) => {
            const invalid = isInvalid(it);
            const shared = people.filter((p) => it.sharedBy.includes(p.id));
            const all = shared.length === people.length && people.length > 0;
            const units = Math.round(it.amount * unit);
            const each = shared.length ? Math.floor(units / shared.length) : 0;
            const rest = units - each * shared.length;

            return (
              <motion.li
                key={it.id}
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0 }}
                transition={springs.gentle}
                className="overflow-hidden"
              >
                <div className="py-3">
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={t.itemName}
                      value={it.name}
                      onChange={(e) => patch(it.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded-sm bg-transparent text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <input
                      aria-label={`${it.name} ${t.amount}`}
                      aria-invalid={invalid || undefined}
                      inputMode="decimal"
                      autoComplete="off"
                      value={drafts[it.id] ?? String(it.amount)}
                      onChange={(e) => setAmount(it.id, e.target.value)}
                      onBlur={() => !invalid && setDrafts(({ [it.id]: _, ...d }) => d)}
                      className={cn(
                        "w-24 rounded-sm border-b border-dashed bg-transparent text-right text-sm font-semibold tracking-tight tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        edge,
                      )}
                    />
                  </div>

                  <div role="group" aria-label={`${it.name}: ${t.sharedBy}`} className="mt-2 flex flex-wrap gap-1.5">
                    <Chip pressed={all} onClick={() => patch(it.id, { sharedBy: all ? [] : people.map((p) => p.id) })}>
                      {t.all}
                    </Chip>
                    {people.map((p) => {
                      const on = it.sharedBy.includes(p.id);
                      return (
                        <Chip
                          key={p.id}
                          pressed={on}
                          hue={personHue(p.id)}
                          onClick={() =>
                            patch(it.id, { sharedBy: on ? it.sharedBy.filter((x) => x !== p.id) : [...it.sharedBy, p.id] })
                          }
                        >
                          {p.name}
                        </Chip>
                      );
                    })}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-xs tabular-nums">
                    {invalid ? (
                      <span className="text-destructive">{t.invalidAmount}</span>
                    ) : !shared.length ? (
                      <span className="text-destructive">{t.noOne}</span>
                    ) : (
                      <span className={inkMuted}>
                        {t.perPerson(shared.length, money(each), rest === 0)}
                        {rest > 0 && <>, {t.leftover(money(rest), shared[0].name)}</>}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => commit(items.filter((x) => x.id !== it.id))}
                      aria-label={`${typeof t.remove === "string" ? t.remove : "Remove"} ${it.name}`}
                      className={cn("underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none", inkMuted)}
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className={cn("border-t border-dashed px-4 py-2", edge)}>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
          {t.addItem}
        </button>
      </div>

      <div className={cn("space-y-1 border-t px-4 py-3 text-sm tabular-nums", edge)} aria-live="polite">
        <p className="flex justify-between">
          <span className={inkMuted}>{t.itemsTotal}</span>
          <span className="font-semibold tracking-tight">{money(validUnits)}</span>
        </p>
        {billUnits !== null && (
          <>
            <p className="flex justify-between">
              <span className={inkMuted}>{t.billTotal}</span>
              <span className="font-semibold tracking-tight">{money(billUnits)}</span>
            </p>
            <p className={cn("flex items-center gap-1.5 text-xs", diff === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
              <span aria-hidden="true">{diff === 0 ? "✓" : "!"}</span>
              {diff === 0 ? t.matches : t.difference(money(Math.abs(diff)), diff > 0)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ pressed, hue, onClick, children }: { pressed: boolean; hue?: number; onClick: () => void; children: ReactNode }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.94 }}
      transition={springs.snappy}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
        pressed ? cn(inkFill, "border-transparent") : cn(edge, "bg-transparent hover:bg-[#1c1917]/5 dark:hover:bg-[#ece7dc]/5"),
      )}
    >
      {hue !== undefined && (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: `hsl(${hue} 55% 52%)` }} />
      )}
      {children}
    </motion.button>
  );
}
