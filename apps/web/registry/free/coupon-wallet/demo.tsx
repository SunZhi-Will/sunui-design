"use client";

import { useState } from "react";

import { CouponWallet, type WalletCoupon } from "./coupon-wallet";

const coupons: WalletCoupon[] = [
  { id: "welcome", amount: "$10", title: "Welcome back", condition: "Orders over $60", expires: "Ends Nov 30" },
  { id: "autumn", amount: "15%", title: "Autumn knitwear", condition: "Knitwear only, up to $40 off", expires: "Ends Nov 12" },
  { id: "ship", amount: "$6", title: "Free shipping", condition: "Any order", expires: "Ends Dec 31" },
  { id: "vip", amount: "$25", title: "Member reward", condition: "Orders over $150", expires: "Ends Nov 20", unavailableReason: "Spend $42 more to use this" },
];

const subtotal = 108;
const off: Record<string, number> = { welcome: 10, autumn: 16.2, ship: 6 };
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function CouponWalletDemo() {
  const [picked, setPicked] = useState<string | null>("welcome");
  const discount = picked ? (off[picked] ?? 0) : 0;

  return (
    <section aria-labelledby="wallet-heading" className="w-full max-w-sm space-y-3">
      <div>
        <h2 id="wallet-heading" className="text-base font-semibold tracking-tight">
          Apply a coupon
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">You have 4 coupons. One can be used per order.</p>
      </div>
      <CouponWallet coupons={coupons} value={picked} onChange={setPicked} />
      <dl className="space-y-1 border-t pt-3 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Coupon</dt>
          <dd>{discount ? `-${money(discount)}` : "None"}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Total</dt>
          <dd>{money(subtotal - discount)}</dd>
        </div>
      </dl>
    </section>
  );
}
