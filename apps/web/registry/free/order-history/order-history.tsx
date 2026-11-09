"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { Stamp } from "@/components/ui/stamp";
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
  /** 介面語言與金額格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  currency?: string;
  /** 展開後明細下方的動作，例如「再買一次」或「追蹤包裹」 */
  renderActions?: (order: HistoryOrder) => ReactNode;
  /** 沒有訂單時放在提示文字下方，例如回到商店的連結 */
  emptyAction?: ReactNode;
  /** 換掉沒有訂單時的收據圖示；任何 SVG 都會縮到 32px */
  emptyIcon?: ReactNode;
  defaultExpandedId?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: OrderHistoryLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

interface OrderHistoryMessages {
  status: Record<OrderStatus, string>;
  items: (count: number) => string;
  shipping: ReactNode;
  discount: ReactNode;
  total: ReactNode;
  free: ReactNode;
  empty: ReactNode;
  toggle: (number: string) => string;
}

const MESSAGES: Record<SunLocale, OrderHistoryMessages> = {
  en: {
    status: { pending: "Unpaid", paid: "Paid", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" },
    items: (count) => `${count} item${count === 1 ? "" : "s"}`,
    shipping: "Shipping",
    discount: "Discount",
    total: "Total",
    free: "Free",
    empty: "No orders yet. Anything you buy will show up here with its receipt.",
    toggle: (number) => `Order ${number} details`,
  },
  "zh-TW": {
    status: { pending: "待付款", paid: "已付款", shipped: "已出貨", delivered: "已送達", cancelled: "已取消" },
    items: (count) => `${count} 件商品`,
    shipping: "運費",
    discount: "折扣",
    total: "總計",
    free: "免運",
    empty: "還沒有訂單。之後買的東西都會連同收據出現在這裡。",
    toggle: (number) => `訂單 ${number} 明細`,
  },
  "zh-CN": {
    status: { pending: "待付款", paid: "已付款", shipped: "已发货", delivered: "已送达", cancelled: "已取消" },
    items: (count) => `${count} 件商品`,
    shipping: "运费",
    discount: "优惠",
    total: "合计",
    free: "包邮",
    empty: "还没有订单。之后购买的商品都会连同小票显示在这里。",
    toggle: (number) => `订单 ${number} 明细`,
  },
  ja: {
    status: { pending: "未払い", paid: "支払済", shipped: "発送済", delivered: "配達済", cancelled: "キャンセル" },
    items: (count) => `${count} 点`,
    shipping: "送料",
    discount: "割引",
    total: "合計",
    free: "無料",
    empty: "まだ注文はありません。購入したものはレシートと一緒にここに表示されます。",
    toggle: (number) => `注文 ${number} の詳細`,
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

/** 朱紅只留給「待付款」這個需要買家行動的狀態；取消用淡墨 */

export function OrderHistory({
  orders,
  title,
  locale = "en-US",
  currency = "USD",
  renderActions,
  emptyAction,
  emptyIcon,
  defaultExpandedId,
  labels,
  className,
}: OrderHistoryProps) {
  const base = MESSAGES[resolveLocale(locale)];
  const t = { ...base, ...labels, status: { ...base.status, ...labels?.status } };
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
          {emptyIcon ? (
            <span aria-hidden="true" className={cn("mx-auto grid w-fit place-items-center [&_svg]:size-8", inkMuted)}>
              {emptyIcon}
            </span>
          ) : (
            <ReceiptIcon className={cn("mx-auto", inkMuted)} />
          )}
          <p className={cn("mx-auto mt-3 max-w-[18rem] text-sm text-pretty", inkMuted)}>{t.empty}</p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <ul className="divide-y divide-dashed divide-[#e2e2e2] dark:divide-[#333333]">
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
                          <Stamp key={o.status} size="sm" seed={o.id} tone={o.status === "pending" ? "vermilion" : "ink"} void={o.status === "cancelled"}>
                            {t.status[o.status]}
                          </Stamp>
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
                    viewBox="0 0 24 24"
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
                    <path d="M6 9.5l6 6 6-6" />
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
