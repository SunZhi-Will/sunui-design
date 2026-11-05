"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ShippingOptions } from "./shipping-options";

const copy = {
  en: {
    heading: "Delivery",
    body: "Orders placed before 2 PM ship the same day.",
    standard: ["Standard", "Mon, Nov 10", "Orders over $50"],
    express: ["Express", "Fri, Nov 7", "Tracked, signature on arrival"],
    pickup: ["Store pickup", "Today after 5 PM", "Market St. store"],
    sameDay: ["Same day", "Unavailable for your area"],
  },
  "zh-TW": {
    heading: "配送",
    body: "下午 2 點前下單，當天出貨。",
    standard: ["標準配送", "11 月 10 日（週一）", "訂單滿 $50"],
    express: ["快速配送", "11 月 7 日（週五）", "全程追蹤，到貨簽收"],
    pickup: ["門市取貨", "今天下午 5 點後", "市場街門市"],
    sameDay: ["當日到貨", "你的地區暫不提供"],
  },
  "zh-CN": {
    heading: "配送",
    body: "下午 2 点前下单，当天发货。",
    standard: ["标准配送", "11 月 10 日（周一）", "订单满 $50"],
    express: ["快速配送", "11 月 7 日（周五）", "全程跟踪，送达签收"],
    pickup: ["门店自提", "今天下午 5 点后", "市场街门店"],
    sameDay: ["当日达", "你所在的地区暂不支持"],
  },
  ja: {
    heading: "配送",
    body: "午後 2 時までのご注文は当日発送します。",
    standard: ["通常配送", "11月10日（月）", "$50 以上のご注文"],
    express: ["お急ぎ便", "11月7日（金）", "追跡あり、受け取り時にサイン"],
    pickup: ["店舗受け取り", "本日 17 時以降", "マーケット通り店"],
    sameDay: ["当日配送", "お住まいの地域は対象外です"],
  },
};

export default function ShippingOptionsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="ship-heading" className="w-full max-w-[52rem] space-y-4">
      <div>
        <h2 id="ship-heading" className="text-xl font-semibold tracking-tight">
          {t.heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
      </div>
      <ShippingOptions
        locale={locale}
        defaultValue="standard"
        options={[
          { id: "standard", name: t.standard[0], eta: t.standard[1], fee: 0, note: t.standard[2] },
          { id: "express", name: t.express[0], eta: t.express[1], fee: 9.9, note: t.express[2] },
          { id: "pickup", name: t.pickup[0], eta: t.pickup[1], fee: 0, note: t.pickup[2] },
          { id: "same-day", name: t.sameDay[0], eta: t.sameDay[1], fee: 15, disabled: true },
        ]}
      />
    </section>
  );
}
