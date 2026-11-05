"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CountdownBanner } from "./countdown-banner";

const copy = {
  en: {
    a: { title: "Studio Headphones, launch week", subtitle: "Launch price for the first week, then back to $129.", discount: "40% OFF", cta: "Shop headphones" },
    b: { title: "11.11 only: second water bottle 40% off", subtitle: "Applied at checkout, no code needed.", discount: "40% OFF", cta: "Shop now" },
    c: { title: "Desk Lamp, weekend price", subtitle: "This offer has ended. The lamp is still available at the regular price.", discount: "25% OFF", cta: "Shop lamps" },
    live: { title: "Live shopping: Studio Headphones Q&A", subtitle: "One hour with the product team. The stream price applies only while we are live.", discount: "15% OFF", cta: "Remind me", schedule: "every Wed, 8:00 PM (GMT+8)" },
  },
  "zh-TW": {
    a: { title: "錄音室耳機，上市週", subtitle: "首週上市價，之後恢復 $129。", discount: "6 折", cta: "選購耳機" },
    b: { title: "雙十一限定：保溫瓶第二件 6 折", subtitle: "結帳自動折抵，不需輸入優惠碼。", discount: "6 折", cta: "立即選購" },
    c: { title: "桌燈，週末特價", subtitle: "優惠已結束，桌燈仍可用原價購買。", discount: "75 折", cta: "選購桌燈" },
    live: { title: "直播選購：錄音室耳機問答", subtitle: "產品團隊陪你一小時。直播價只在直播進行中有效。", discount: "85 折", cta: "提醒我", schedule: "每週三 20:00（GMT+8）" },
  },
  "zh-CN": {
    a: { title: "录音室耳机，上市周", subtitle: "首周上市价，之后恢复 $129。", discount: "6 折", cta: "选购耳机" },
    b: { title: "双十一限定：保温杯第二件 6 折", subtitle: "结账自动抵扣，无需输入优惠码。", discount: "6 折", cta: "立即选购" },
    c: { title: "台灯，周末特价", subtitle: "优惠已结束，台灯仍可按原价购买。", discount: "75 折", cta: "选购台灯" },
    live: { title: "直播选购：录音室耳机问答", subtitle: "产品团队陪你一小时。直播价仅在直播进行中有效。", discount: "85 折", cta: "提醒我", schedule: "每周三 20:00（GMT+8）" },
  },
  ja: {
    a: { title: "スタジオヘッドホン、発売記念週間", subtitle: "最初の 1 週間だけの発売記念価格。その後は $129 に戻ります。", discount: "40% OFF", cta: "ヘッドホンを見る" },
    b: { title: "11.11 限定：水筒 2 本目が 40% OFF", subtitle: "会計時に自動で割引。クーポンコードは不要です。", discount: "40% OFF", cta: "今すぐ購入" },
    c: { title: "デスクランプ、週末価格", subtitle: "このセールは終了しました。ランプは通常価格でお買い求めいただけます。", discount: "25% OFF", cta: "ランプを見る" },
    live: { title: "ライブショッピング：スタジオヘッドホン Q&A", subtitle: "製品チームと過ごす 1 時間。配信価格は配信中のみ有効です。", discount: "15% OFF", cta: "リマインドする", schedule: "毎週水曜 20:00（GMT+8）" },
  },
};

const HOUR = 3_600_000;

/** 每週三 20:00（GMT+8）的直播：回傳這一場或下一場的開始時間 */
function nextStream() {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((3 - d.getUTCDay() + 7) % 7));
  if (d.getTime() + HOUR <= Date.now()) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

export default function CountdownBannerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 結束時間在初始化時算一次，不在 render 中呼叫 Date.now()
  const [dates] = useState(() => ({
    days: new Date(Date.now() + 3 * 86_400_000 + 5 * 3_600_000 + 12 * 60_000),
    hours: new Date(Date.now() + 4 * 3_600_000 + 26 * 60_000),
    past: new Date(Date.now() - 3_600_000),
    stream: nextStream(),
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
      {/* 倒數到直播開始；伺服器只印固定的場次文字，不印會跳動的數字 */}
      <CountdownBanner
        locale={locale}
        title={t.live.title}
        subtitle={t.live.subtitle}
        discount={t.live.discount}
        discountedPrice="$109"
        originalPrice="$129"
        ctaText={t.live.cta}
        ctaHref="#"
        startDate={dates.stream}
        endDate={new Date(dates.stream.getTime() + HOUR)}
        dateLabel={t.live.schedule}
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
