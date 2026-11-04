"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderLine {
  name: string;
  /** 規格，例如 "Size M, Oat" */
  variant?: string;
  qty: number;
  /** 單價 */
  price: number;
}

export interface HistoryOrder {
  id: string;
  /** 顯示用訂單編號 */
  number: string;
  date: string;
  status: OrderStatus;
  lines: OrderLine[];
  shipping?: number;
  discount?: number;
}

export interface OrderHistoryLabels {
  status?: Partial<Record<OrderStatus, string>>;
  items?: (count: number) => string;
  shipping?: ReactNode;
  discount?: ReactNode;
  total?: ReactNode;
  free?: ReactNode;
  empty?: ReactNode;
  toggle?: (number: string) => string;
}

export interface OrderHistoryProps {
  orders: HistoryOrder[];
  title?: ReactNode;
  locale?: string;
  currency?: string;
  /** 展開後明細下方的動作，例如「再買一次」或「追蹤包裹」 */
  renderActions?: (order: HistoryOrder) => ReactNode;
  /** 沒有訂單時放在提示文字下方，例如回到商店的連結 */
  emptyAction?: ReactNode;
  defaultExpandedId?: string;
  labels?: OrderHistoryLabels;
  className?: string;
}

const statusText: Record<OrderStatus, string> = {
  pending: "Unpaid",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const defaultLabels = {
  items: (count: number) => `${count} item${count === 1 ? "" : "s"}`,
  shipping: "Shipping",
  discount: "Discount",
  total: "Total",
  free: "Free",
  empty: "No orders yet. Anything you buy will show up here with its receipt.",
  toggle: (number: string) => `Order ${number} details`,
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

/** 朱紅只留給「待付款」這個需要買家行動的狀態；取消用淡墨 */
const stampTone: Record<OrderStatus, string> = {
  pending: vermilion,
  paid: ink,
  shipped: ink,
  delivered: ink,
  cancelled: inkMuted,
};

export function OrderHistory({
  orders,
  title,
  locale = "en-US",
  currency = "USD",
  renderActions,
  emptyAction,
  defaultExpandedId,
  labels,
  className,
}: OrderHistoryProps) {
  const t = { ...defaultLabels, ...labels, status: { ...statusText, ...labels?.status } };
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const [open, setOpen] = useState<string | null>(defaultExpandedId ?? null);

  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
  const money = (n: number) => fmt.format(n);
  const subtotal = (o: HistoryOrder) => o.lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = (o: HistoryOrder) => subtotal(o) + (o.shipping ?? 0) - (o.discount ?? 0);
  const count = (o: HistoryOrder) => o.lines.reduce((s, l) => s + l.qty, 0);

  return (
    <section className={cn("w-full max-w-md rounded-md border font-sans", paper, edge, ink, className)}>
      {title && <h3 className={cn("border-b border-dashed px-4 py-3 text-sm font-semibold tracking-tight", edge)}>{title}</h3>}

      {orders.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <ReceiptIcon className={cn("mx-auto", inkMuted)} />
          <p className={cn("mx-auto mt-3 max-w-[18rem] text-sm text-pretty", inkMuted)}>{t.empty}</p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <ul className="divide-y divide-dashed divide-[#e7e0d0] dark:divide-[#38332b]">
          {orders.map((o) => {
            const expanded = open === o.id;
            const panelId = `${baseId}-${o.id}`;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  aria-label={`${t.toggle(o.number)}, ${o.date}, ${t.status[o.status]}, ${money(total(o))}`}
                  onClick={() => setOpen(expanded ? null : o.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-current/[0.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-mono text-xs tracking-[0.12em]">#{o.number}</span>
                      <span className="relative inline-flex">
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.span
                            key={o.status}
                            aria-hidden="true"
                            className={cn(
                              "inline-block rounded-[3px] border-[1.5px] border-current px-1.5 py-px text-[10px] font-bold tracking-[0.16em] whitespace-nowrap uppercase opacity-85 mix-blend-multiply dark:mix-blend-screen",
                              stampTone[o.status],
                              o.status === "cancelled" && "line-through decoration-1",
                            )}
                            initial={reduce ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
                            animate={{ scale: 1, opacity: 0.85, rotate: -8 }}
                            exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.12 } }}
                            transition={springs.stamp}
                          >
                            {t.status[o.status]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </span>
                    <span className={cn("mt-0.5 block truncate text-xs tabular-nums", inkMuted)}>
                      {o.date} · {t.items(count(o))}
                    </span>
                  </span>
                  <span className={cn("w-20 shrink-0 text-right text-sm font-semibold tracking-tight tabular-nums", o.status === "cancelled" && inkMuted)}>
                    {money(total(o))}
                  </span>
                  <motion.svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className={cn("size-4 shrink-0", inkMuted)}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={reduce ? { duration: 0 } : springs.gentle}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </motion.svg>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={reduce ? false : { height: 0 }}
                      animate={{ height: "auto" }}
                      exit={reduce ? { height: 0, transition: { duration: 0 } } : { height: 0 }}
                      transition={springs.gentle}
                      className="overflow-hidden"
                    >
                      <div className={cn("mx-4 mb-4 border-t border-dashed pt-3 text-sm", edge)}>
                        <ul className="space-y-2">
                          {o.lines.map((l, i) => (
                            <li key={`${l.name}-${i}`} className="flex items-baseline gap-2">
                              <span className="min-w-0">
                                <span className="block truncate">{l.name}</span>
                                <span className={cn("block text-xs tabular-nums", inkMuted)}>
                                  {l.variant ? `${l.variant} · ` : ""}
                                  {l.qty} × {money(l.price)}
                                </span>
                              </span>
                              <span aria-hidden="true" className={cn("flex-1 translate-y-[-3px] border-b border-dotted", edge)} />
                              <span className="shrink-0 tabular-nums">{money(l.qty * l.price)}</span>
                            </li>
                          ))}
                        </ul>
                        <dl className={cn("mt-3 space-y-1 border-t border-dashed pt-2 text-xs tabular-nums", edge, inkMuted)}>
                          <div className="flex justify-between">
                            <dt>{t.shipping}</dt>
                            <dd>{o.shipping ? money(o.shipping) : t.free}</dd>
                          </div>
                          {!!o.discount && (
                            <div className="flex justify-between">
                              <dt>{t.discount}</dt>
                              <dd>-{money(o.discount)}</dd>
                            </div>
                          )}
                          <div className={cn("flex justify-between pt-1 text-sm font-semibold", ink)}>
                            <dt>{t.total}</dt>
                            <dd>{money(total(o))}</dd>
                          </div>
                        </dl>
                        {renderActions && <div className="mt-3 flex flex-wrap gap-2">{renderActions(o)}</div>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("size-8", className)}>
      <path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </svg>
  );
}
