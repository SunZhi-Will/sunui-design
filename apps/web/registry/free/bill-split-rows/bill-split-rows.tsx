"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 移植自 spliteat-web 的餐點頁（items-page-client.tsx、ui.tsx 的 Section 與 MemberToggle），
// 新增一列的浮現動畫取自 dinner-split 的 ItemCard（.pop-in）。

export interface SplitMember {
  id: string;
  name: string;
}

export interface SplitItem {
  id: string;
  name: string;
  /** 使用者輸入的原始字串，驗證前不轉數字（空白不能悄悄變成 0） */
  price: string;
  qty: string;
  /** 吃了這道的人 */
  eaters: string[];
}

export interface BillSplitRowsLabels {
  title?: ReactNode;
  meta?: (items: number, counted: number) => ReactNode;
  name?: ReactNode;
  namePlaceholder?: (n: number) => string;
  price?: ReactNode;
  qty?: ReactNode;
  remove?: (name: string) => string;
  fallbackName?: (n: number) => string;
  whoAte?: ReactNode;
  selectAll?: ReactNode;
  clearAll?: ReactNode;
  addAnother?: ReactNode;
  emptyTitle?: ReactNode;
  emptyBody?: ReactNode;
  notCounted?: (problems: string[]) => ReactNode;
  solo?: (total: string) => ReactNode;
  shared?: (total: string, count: number, each: string, remainder: boolean) => ReactNode;
  problemName?: string;
  problemPrice?: string;
  problemQty?: string;
  problemEaters?: string;
}

export interface BillSplitRowsProps {
  members: SplitMember[];
  items?: SplitItem[];
  defaultItems?: SplitItem[];
  onItemsChange?: (items: SplitItem[]) => void;
  /** 給了就交給父層刪除（例如搭配復原提示）；沒給就直接刪 */
  onRemove?: (item: SplitItem, index: number) => void;
  newId?: () => string;
  formatAmount?: (n: number) => string;
  /** 成員識別色，只上在小圓點 */
  colorOf?: (index: number) => string;
  labels?: BillSplitRowsLabels;
  className?: string;
}

const defaultLabels: Required<BillSplitRowsLabels> = {
  title: "What we ate",
  meta: (n, c) => `${n} ${n === 1 ? "dish" : "dishes"} · ${c} counted`,
  name: "Dish",
  namePlaceholder: (n) => `Dish ${n}, e.g. beef noodles`,
  price: "Price",
  qty: "Qty",
  remove: (name) => `Delete ${name}`,
  fallbackName: (n) => `dish ${n}`,
  whoAte: "Who ate it",
  selectAll: "Everyone",
  clearAll: "Clear all",
  addAnother: "Add another dish",
  emptyTitle: "No dishes yet",
  emptyBody: "Add them one by one and tick who ate each.",
  notCounted: (p) => `Not counted yet: ${p.join(", ")}`,
  solo: (total) => `${total}, one person, pays it all`,
  shared: (total, n, each, rem) => `${total}, split ${n} ways, about ${each} each${rem ? ", leftover goes in list order" : ""}`,
  problemName: "needs a name",
  problemPrice: "price must be a whole number above 0",
  problemQty: "quantity must be a whole number above 0",
  problemEaters: "no one picked",
};

// spliteat-web 的成員色盤（employee-chip.tsx 的 fg），照名單順序從第 2 色開始
const PALETTE = ["#2563EB", "#16A34A", "#D97706", "#DB2777", "#7C3AED", "#0891B2", "#E11D48", "#65A30D"];
const paletteColor = (index: number) => PALETTE[(index + 1) % PALETTE.length];

/** 價格與數量只收正整數（允許千分位逗號與空白） */
export function parsePositiveInt(raw: string): number | null {
  const s = String(raw ?? "").replace(/[,，\s]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= 10_000_000 ? n : null;
}

const defaultFormat = (n: number) => `NT$${n.toLocaleString("en-US")}`;
let seq = 0;
const defaultNewId = () => `i-${Date.now().toString(36)}-${++seq}`;

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-[#71717A]/50";
const inputCls = cn(
  "h-10 w-full min-w-0 rounded-lg border border-[#D4D4D8] bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground md:text-sm dark:border-white/12 dark:bg-white/[0.036]",
  "focus-visible:border-[#71717A] focus-visible:ring-3 focus-visible:ring-[#71717A]/50",
  "aria-invalid:border-[#DC2626] aria-invalid:ring-3 aria-invalid:ring-[#DC2626]/20 dark:aria-invalid:border-[#F87171]/50",
);
const labelCls = "mb-1.5 flex items-center gap-2 text-xs leading-none font-medium text-muted-foreground select-none";

/** 可點的成員標籤：選到時反白（前景色底） */
export function MemberToggle({
  name,
  color,
  on,
  onClick,
}: {
  name: string;
  /** 識別色，只上在小圓點 */
  color: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm font-medium whitespace-nowrap transition-colors",
        focusRing,
        on
          ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground",
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: on ? "currentColor" : color }} />
      {name}
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("size-4 shrink-0", className)}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function BillSplitRows({
  members,
  items: itemsProp,
  defaultItems = [],
  onItemsChange,
  onRemove,
  newId = defaultNewId,
  formatAmount = defaultFormat,
  colorOf = paletteColor,
  labels,
  className,
}: BillSplitRowsProps) {
  const l = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const titleId = useId();
  const [inner, setInner] = useState(defaultItems);
  const items = itemsProp ?? inner;
  const focusRef = useRef<string | null>(null);
  // 只有之後新增的列才播浮現動畫
  const fresh = useRef(new Set<string>());
  const memberIds = members.map((m) => m.id);

  const commit = (next: SplitItem[]) => {
    if (itemsProp === undefined) setInner(next);
    onItemsChange?.(next);
  };

  // 新增一道之後，游標直接放在品名
  useEffect(() => {
    if (!focusRef.current) return;
    document.getElementById(`${focusRef.current}-name`)?.focus();
    focusRef.current = null;
  });

  const update = (id: string, patch: Partial<SplitItem>) => commit(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const add = () => {
    const id = newId();
    focusRef.current = id;
    fresh.current.add(id);
    commit([...items, { id, name: "", price: "", qty: "1", eaters: [] }]);
  };

  const toggle = (item: SplitItem, memberId: string) =>
    update(item.id, { eaters: item.eaters.includes(memberId) ? item.eaters.filter((x) => x !== memberId) : [...item.eaters, memberId] });

  const problemsOf = (item: SplitItem) => {
    const out: string[] = [];
    if (!item.name.trim()) out.push(l.problemName);
    if (parsePositiveInt(item.price) === null) out.push(l.problemPrice);
    if (parsePositiveInt(item.qty) === null) out.push(l.problemQty);
    if (!item.eaters.some((id) => memberIds.includes(id))) out.push(l.problemEaters);
    return out;
  };
  const counted = items.filter((it) => problemsOf(it).length === 0).length;

  return (
    <section aria-labelledby={titleId} className={cn("w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-sm text-card-foreground", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id={titleId} className="text-sm font-semibold">
          {l.title}
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{l.meta(items.length, counted)}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6 text-muted-foreground">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 17.5v-11" />
          </svg>
          <div>
            <p className="text-sm font-medium">{l.emptyTitle}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{l.emptyBody}</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it, i) => {
            const problems = problemsOf(it);
            const total = (parsePositiveInt(it.price) ?? 0) * (parsePositiveInt(it.qty) ?? 0);
            const sharing = it.eaters.filter((x) => memberIds.includes(x)).length;
            const allOn = members.length > 0 && members.every((m) => it.eaters.includes(m.id));
            const badPrice = it.price.trim() !== "" && parsePositiveInt(it.price) === null;
            const badQty = it.qty.trim() !== "" && parsePositiveInt(it.qty) === null;
            const pop = fresh.current.has(it.id) && !reduce;
            return (
              <motion.li
                key={it.id}
                className="p-4"
                initial={pop ? { opacity: 0, y: 6, scale: 0.98 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4rem_auto] items-end gap-2">
                  <div className="min-w-0">
                    <label htmlFor={`${it.id}-name`} className={labelCls}>
                      {l.name}
                    </label>
                    <input
                      id={`${it.id}-name`}
                      value={it.name}
                      onChange={(e) => update(it.id, { name: e.target.value })}
                      placeholder={l.namePlaceholder(i + 1)}
                      maxLength={20}
                      autoComplete="off"
                      className={inputCls}
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor={`${it.id}-price`} className={labelCls}>
                      {l.price}
                    </label>
                    <input
                      id={`${it.id}-price`}
                      value={it.price}
                      onChange={(e) => update(it.id, { price: e.target.value })}
                      inputMode="numeric"
                      placeholder="0"
                      autoComplete="off"
                      aria-invalid={badPrice || undefined}
                      className={cn(inputCls, "text-right font-semibold tabular-nums")}
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor={`${it.id}-qty`} className={labelCls}>
                      {l.qty}
                    </label>
                    <input
                      id={`${it.id}-qty`}
                      value={it.qty}
                      onChange={(e) => update(it.id, { qty: e.target.value })}
                      inputMode="numeric"
                      placeholder="1"
                      autoComplete="off"
                      aria-invalid={badQty || undefined}
                      className={cn(inputCls, "text-right font-semibold tabular-nums")}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={l.remove(it.name.trim() || l.fallbackName(i + 1))}
                    onClick={() => (onRemove ? onRemove(it, i) : commit(items.filter((x) => x.id !== it.id)))}
                    className={cn(
                      "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:translate-y-px",
                      focusRing,
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{l.whoAte}</span>
                  {members.length > 1 ? (
                    <button
                      type="button"
                      className={cn("cursor-pointer rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground", focusRing)}
                      onClick={() => update(it.id, { eaters: allOn ? [] : [...memberIds] })}
                    >
                      {allOn ? l.clearAll : l.selectAll}
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {members.map((m, k) => (
                    <MemberToggle key={m.id} name={m.name} color={colorOf(k)} on={it.eaters.includes(m.id)} onClick={() => toggle(it, m.id)} />
                  ))}
                </div>

                <p
                  className={cn(
                    "mt-3 flex items-center gap-1.5 text-xs",
                    problems.length ? "text-[#DC2626] dark:text-[#F87171]" : "text-muted-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 shrink-0 rounded-full", problems.length ? "bg-[#DC2626] dark:bg-[#F87171]" : "bg-[#15803D] dark:bg-[#4ADE80]")}
                  />
                  <span className="min-w-0 tabular-nums">
                    {problems.length
                      ? l.notCounted(problems)
                      : sharing === 1
                        ? l.solo(formatAmount(total))
                        : l.shared(formatAmount(total), sharing, formatAmount(Math.floor(total / sharing)), total % sharing !== 0)}
                  </span>
                </p>
              </motion.li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 border-t border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          focusRing,
        )}
      >
        <PlusIcon />
        {l.addAnother}
      </button>
    </section>
  );
}
