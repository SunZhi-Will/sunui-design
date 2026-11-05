"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ClassicCountdownBanner } from "./classic-countdown-banner";

const DAY = 24 * 60 * 60 * 1000;

const copy = {
  en: { title: "Annual plan, spring pricing", subtitle: "The price goes back to normal when the timer ends.", discount: "40% off", cta: "See annual pricing" },
  "zh-TW": { title: "年付方案春季價", subtitle: "倒數結束後恢復原價。", discount: "6 折", cta: "查看年付價格" },
  "zh-CN": { title: "年付方案春季价", subtitle: "倒计时结束后恢复原价。", discount: "6 折", cta: "查看年付价格" },
  ja: { title: "年額プラン 春の特別価格", subtitle: "カウントダウン終了後は通常価格に戻ります。", discount: "40%OFF", cta: "年額料金を見る" },
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
