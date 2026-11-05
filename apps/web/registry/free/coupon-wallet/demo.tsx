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

const copy = {
  en: { heading: "Apply a coupon", intro: "You have 4 coupons. One can be used per order.", subtotal: "Subtotal", coupon: "Coupon", none: "None", total: "Total" },
  "zh-TW": { heading: "使用優惠券", intro: "你有 4 張優惠券，每筆訂單限用一張。", subtotal: "小計", coupon: "優惠券", none: "未使用", total: "總計" },
  "zh-CN": { heading: "使用优惠券", intro: "你有 4 张优惠券，每笔订单限用一张。", subtotal: "小计", coupon: "优惠券", none: "未使用", total: "合计" },
  ja: { heading: "クーポンを使う", intro: "クーポンが 4 枚あります。1 回の注文につき 1 枚使えます。", subtotal: "小計", coupon: "クーポン", none: "なし", total: "合計" },
};

export default function CouponWalletDemo() {
  const locale = useDemoLocale();
  const list = useDemoText(coupons);
  const t = useDemoText(copy);
  const [picked, setPicked] = useState<string | null>("welcome");
  const discount = picked ? (off[picked] ?? 0) : 0;

  return (
    <section aria-labelledby="wallet-heading" className="w-full max-w-sm space-y-3">
      <div>
        <h2 id="wallet-heading" className="text-base font-semibold tracking-tight">
          {t.heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <CouponWallet coupons={list} locale={locale} value={picked} onChange={setPicked} />
      <dl className="space-y-1 border-t pt-3 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t.subtotal}</dt>
          <dd>{money(subtotal, locale)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t.coupon}</dt>
          <dd>{discount ? `-${money(discount, locale)}` : t.none}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>{t.total}</dt>
          <dd>{money(subtotal - discount, locale)}</dd>
        </div>
      </dl>
    </section>
  );
}
