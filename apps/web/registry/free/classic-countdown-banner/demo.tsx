"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ClassicCountdownBanner } from "./classic-countdown-banner";

const DAY = 24 * 60 * 60 * 1000;

const copy = {
  en: { title: "Limited Time Offer", subtitle: "Hurry, offer ends soon!", discount: "40% OFF", cta: "Shop Now" },
  "zh-TW": { title: "限時優惠", subtitle: "把握時間，優惠即將結束！", discount: "6 折", cta: "立即選購" },
  "zh-CN": { title: "限时优惠", subtitle: "抓紧时间，优惠即将结束！", discount: "6 折", cta: "立即抢购" },
  ja: { title: "期間限定オファー", subtitle: "お急ぎください、まもなく終了！", discount: "40%OFF", cta: "今すぐ購入" },
};

export default function ClassicCountdownBannerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 結束時間在初始化時算一次
  const [endDate] = useState(() => new Date(Date.now() + 3 * DAY));

  return (
    <div className="w-full max-w-4xl min-w-0">
      <ClassicCountdownBanner
        locale={locale}
        title={t.title}
        subtitle={t.subtitle}
        discount={t.discount}
        originalPrice="$1,199"
        discountedPrice="$719"
        ctaText={t.cta}
        endDate={endDate}
      />
    </div>
  );
}
