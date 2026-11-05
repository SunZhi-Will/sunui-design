"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ShippingOptions } from "./shipping-options";

const copy = {
  en: { standard: ["Standard", "Mon, Nov 10", "Orders over $50"], express: ["Express", "Fri, Nov 7", "Tracked delivery"] },
  "zh-TW": { standard: ["標準配送", "11 月 10 日（週一）", "訂單滿 $50"], express: ["快速配送", "11 月 7 日（週五）", "全程追蹤"] },
  "zh-CN": { standard: ["标准配送", "11 月 10 日（周一）", "订单满 $50"], express: ["快速配送", "11 月 7 日（周五）", "全程跟踪"] },
  ja: { standard: ["通常配送", "11月10日（月）", "$50 以上のご注文"], express: ["お急ぎ便", "11月7日（金）", "追跡あり"] },
};

/** 型錄卡片：兩張票根式配送選項，點選或用方向鍵切換。 */
export default function ShippingOptionsCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="mx-auto w-72">
      <ShippingOptions
        locale={locale}
        defaultValue="standard"
        options={[
          { id: "standard", name: t.standard[0], eta: t.standard[1], fee: 0, note: t.standard[2] },
          { id: "express", name: t.express[0], eta: t.express[1], fee: 9.9, note: t.express[2] },
        ]}
      />
    </div>
  );
}
