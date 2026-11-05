"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CouponWallet, type WalletCoupon } from "./coupon-wallet";

const coupons: Record<"en" | "zh-TW" | "zh-CN" | "ja", WalletCoupon[]> = {
  en: [
    { id: "welcome", amount: "$10", title: "Welcome back", condition: "Orders over $60", expires: "Ends Nov 30" },
    { id: "autumn", amount: "15%", title: "Autumn knitwear", condition: "Knitwear only, up to $40 off", expires: "Ends Nov 12" },
    { id: "ship", amount: "$6", title: "Free shipping", condition: "Any order", expires: "Ends Dec 31" },
    { id: "vip", amount: "$25", title: "Member reward", condition: "Orders over $150", expires: "Ends Nov 20", unavailableReason: "Spend $42 more to use this" },
  ],
  "zh-TW": [
    { id: "welcome", amount: "$10", title: "歡迎回來", condition: "訂單滿 $60", expires: "11/30 到期" },
    { id: "autumn", amount: "15%", title: "秋季針織", condition: "限針織品，最多折 $40", expires: "11/12 到期" },
    { id: "ship", amount: "$6", title: "免運費", condition: "任何訂單皆可", expires: "12/31 到期" },
    { id: "vip", amount: "$25", title: "會員回饋", condition: "訂單滿 $150", expires: "11/20 到期", unavailableReason: "再買 $42 即可使用" },
  ],
  "zh-CN": [
    { id: "welcome", amount: "$10", title: "欢迎回来", condition: "订单满 $60", expires: "11月30日到期" },
    { id: "autumn", amount: "15%", title: "秋季针织", condition: "仅限针织品，最高减 $40", expires: "11月12日到期" },
    { id: "ship", amount: "$6", title: "免运费", condition: "任意订单可用", expires: "12月31日到期" },
    { id: "vip", amount: "$25", title: "会员回馈", condition: "订单满 $150", expires: "11月20日到期", unavailableReason: "再买 $42 即可使用" },
  ],
  ja: [
    { id: "welcome", amount: "$10", title: "おかえりなさい", condition: "$60 以上のご注文", expires: "11月30日まで" },
    { id: "autumn", amount: "15%", title: "秋のニット", condition: "ニット限定、最大 $40 引き", expires: "11月12日まで" },
    { id: "ship", amount: "$6", title: "送料無料", condition: "すべてのご注文", expires: "12月31日まで" },
    { id: "vip", amount: "$25", title: "会員特典", condition: "$150 以上のご注文", expires: "11月20日まで", unavailableReason: "あと $42 で使えます" },
  ],
};

const subtotal = 108;
const off: Record<string, number> = { welcome: 10, autumn: 16.2, ship: 6 };
const money = (n: number, locale: string) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n);

/** 型錄卡片：一疊優惠券，翻選一張套用，下方總額即時跟著變。 */
export default function CouponWalletCard() {
  const locale = useDemoLocale();
  const list = useDemoText(coupons);
  const total = useDemoText({ en: "Total", "zh-TW": "總計", "zh-CN": "合计", ja: "合計" });
  const [picked, setPicked] = useState<string | null>("welcome");
  const discount = picked ? (off[picked] ?? 0) : 0;

  return (
    <div className="mx-auto w-72">
      <CouponWallet coupons={list} locale={locale} value={picked} onChange={setPicked} />
      <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold tabular-nums">
        <span>{total}</span>
        <span>{money(subtotal - discount, locale)}</span>
      </div>
    </div>
  );
}
