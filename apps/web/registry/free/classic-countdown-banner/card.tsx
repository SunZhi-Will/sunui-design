"use client";

import { useState } from "react";

import { ClassicCountdownBanner } from "./classic-countdown-banner";

const DAY = 24 * 60 * 60 * 1000;

/** 型錄卡片：一張倒數橫幅，數字每秒翻動；橫幅比卡片高，放在內部捲動區。 */
export default function ClassicCountdownBannerCard() {
  // 結束時間在初始化時算一次
  const [endDate] = useState(() => new Date(Date.now() + 3 * DAY));

  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto overscroll-contain rounded-xl">
      <ClassicCountdownBanner
        language="en"
        layout="default"
        title="Limited Time Offer"
        subtitle="Hurry, offer ends soon!"
        discount="40% OFF"
        originalPrice="$1,199"
        discountedPrice="$719"
        ctaText="Shop Now"
        endDate={endDate}
        className="p-4"
      />
    </div>
  );
}
