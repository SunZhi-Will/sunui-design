"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CountdownBanner } from "./countdown-banner";

const copy = {
  en: {
    a: { title: "Studio Headphones, launch week", subtitle: "Launch price for the first week, then back to $129.", discount: "40% OFF", cta: "Shop headphones" },
    b: { title: "11.11 only: second water bottle 40% off", subtitle: "Applied at checkout, no code needed.", discount: "40% OFF", cta: "Shop now" },
    c: { title: "Desk Lamp, weekend price", subtitle: "This offer has ended. The lamp is still available at the regular price.", discount: "25% OFF", cta: "Shop lamps" },
  },
  "zh-TW": {
    a: { title: "錄音室耳機，上市週", subtitle: "首週上市價，之後恢復 $129。", discount: "6 折", cta: "選購耳機" },
    b: { title: "雙十一限定：保溫瓶第二件 6 折", subtitle: "結帳自動折抵，不需輸入優惠碼。", discount: "6 折", cta: "立即選購" },
    c: { title: "桌燈，週末特價", subtitle: "優惠已結束，桌燈仍可用原價購買。", discount: "75 折", cta: "選購桌燈" },
  },
  "zh-CN": {
    a: { title: "录音室耳机，上市周", subtitle: "首周上市价，之后恢复 $129。", discount: "6 折", cta: "选购耳机" },
    b: { title: "双十一限定：保温杯第二件 6 折", subtitle: "结账自动抵扣，无需输入优惠码。", discount: "6 折", cta: "立即选购" },
    c: { title: "台灯，周末特价", subtitle: "优惠已结束，台灯仍可按原价购买。", discount: "75 折", cta: "选购台灯" },
  },
  ja: {
    a: { title: "スタジオヘッドホン、発売記念週間", subtitle: "最初の 1 週間だけの発売記念価格。その後は $129 に戻ります。", discount: "40% OFF", cta: "ヘッドホンを見る" },
    b: { title: "11.11 限定：水筒 2 本目が 40% OFF", subtitle: "会計時に自動で割引。クーポンコードは不要です。", discount: "40% OFF", cta: "今すぐ購入" },
    c: { title: "デスクランプ、週末価格", subtitle: "このセールは終了しました。ランプは通常価格でお買い求めいただけます。", discount: "25% OFF", cta: "ランプを見る" },
  },
};

export default function CountdownBannerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 結束時間在初始化時算一次，不在 render 中呼叫 Date.now()
  const [dates] = useState(() => ({
    days: new Date(Date.now() + 3 * 86_400_000 + 5 * 3_600_000 + 12 * 60_000),
    hours: new Date(Date.now() + 4 * 3_600_000 + 26 * 60_000),
    past: new Date(Date.now() - 3_600_000),
  }));

  return (
    <div className="w-full max-w-[60rem] space-y-4">
      <CountdownBanner
        locale={locale}
        title={t.a.title}
        subtitle={t.a.subtitle}
        discount={t.a.discount}
        discountedPrice="$77"
        originalPrice="$129"
        ctaText={t.a.cta}
        ctaHref="#"
        endDate={dates.days}
      />
      <CountdownBanner
        locale={locale}
        title={t.b.title}
        subtitle={t.b.subtitle}
        discount={t.b.discount}
        discountedPrice="NT$594"
        originalPrice="NT$990"
        ctaText={t.b.cta}
        ctaHref="#"
        endDate={dates.hours}
      />
      <CountdownBanner
        locale={locale}
        title={t.c.title}
        subtitle={t.c.subtitle}
        discount={t.c.discount}
        discountedPrice="$66"
        originalPrice="$88"
        ctaText={t.c.cta}
        endDate={dates.past}
      />
    </div>
  );
}
