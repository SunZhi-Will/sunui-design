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
  {
    id: "o4",
    number: "SF-19988",
    date: "Sep 30, 2026",
    status: "cancelled",
    lines: [{ name: "Linen shirt", variant: "Size M, White", qty: 1, price: 74 }],
  },
];

const action = "rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export default function OrderHistoryDemo() {
  return (
    <section aria-labelledby="orders-heading" className="w-full max-w-[52rem] space-y-5">
      <h2 id="orders-heading" className="text-xl font-semibold tracking-tight">
        Your orders
      </h2>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <OrderHistory
          title="Recent orders"
          orders={orders}
          defaultExpandedId="o2"
          renderActions={(o) =>
            o.status === "pending" ? (
              <a href="#pay" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                Complete payment
              </a>
            ) : (
              <>
                {o.status === "shipped" && (
                  <a href="#track" className={action}>
                    Track package
                  </a>
                )}
                <a href="#reorder" className={action}>
                  Buy again
                </a>
              </>
            )
          }
        />
        <OrderHistory
          title="Returns"
          orders={[]}
          labels={{ empty: "No returns in the last 90 days." }}
          className="md:max-w-xs"
          emptyAction={
            <a href="#policy" className="text-xs font-medium underline underline-offset-4">
              Read the return policy
            </a>
          }
        />
      </div>
    </section>
  );
}
