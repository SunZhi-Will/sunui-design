"use client";

import { OrderHistory, type HistoryOrder } from "./order-history";

const orders: HistoryOrder[] = [
  {
    id: "o1",
    number: "SF-20481",
    date: "Nov 4, 2026",
    status: "pending",
    lines: [{ name: "Merino crew sweater", variant: "Size M, Oat", qty: 1, price: 89 }],
    shipping: 6,
  },
  {
    id: "o2",
    number: "SF-20377",
    date: "Oct 28, 2026",
    status: "shipped",
    lines: [
      { name: "Wool overshirt", variant: "Size L, Navy", qty: 1, price: 128 },
      { name: "Cotton socks, 3 pack", qty: 2, price: 18 },
    ],
    discount: 15,
  },
  {
    id: "o3",
    number: "SF-20112",
    date: "Oct 9, 2026",
    status: "delivered",
    lines: [{ name: "Canvas tote", qty: 1, price: 42 }],
    shipping: 6,
  },
];

/** 型錄卡片：三筆訂單收合成一列列，點開任一筆看明細與小計。 */
export default function OrderHistoryCard() {
  return (
    <div className="mx-auto max-h-[228px] w-72 overflow-y-auto overscroll-contain rounded-md">
      <OrderHistory orders={orders} />
    </div>
  );
}
