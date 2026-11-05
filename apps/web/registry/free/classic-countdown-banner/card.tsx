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

/** 型錄卡片：一張倒數橫幅，數字每秒翻動；橫幅比卡片高，放在內部捲動區。 */
export default function ClassicCountdownBannerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 結束時間在初始化時算一次
  const [endDate] = useState(() => new Date(Date.now() + 3 * DAY));

  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto overscroll-contain rounded-xl">
      <ClassicCountdownBanner
        locale={locale}
        layout="default"
        title={t.title}
        subtitle={t.subtitle}
        discount={t.discount}
        originalPrice="$1,199"
        discountedPrice="$719"
        ctaText={t.cta}
        endDate={endDate}
        className="p-4"
      />
    </div>
  );
}
