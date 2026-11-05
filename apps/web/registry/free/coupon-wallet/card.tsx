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

/** 型錄卡片：一疊優惠券，翻選一張套用，下方總額即時跟著變。 */
export default function CouponWalletCard() {
  const [picked, setPicked] = useState<string | null>("welcome");
  const discount = picked ? (off[picked] ?? 0) : 0;

  return (
    <div className="mx-auto w-72">
      <CouponWallet coupons={coupons} value={picked} onChange={setPicked} />
      <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold tabular-nums">
        <span>Total</span>
        <span>{money(subtotal - discount)}</span>
      </div>
    </div>
  );
}
