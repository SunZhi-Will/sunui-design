"use client";

import { useState } from "react";

import { CountdownBanner } from "./countdown-banner";

/** 型錄卡片：一條限時優惠，只看紙上翻頁數字每秒翻下的倒數。 */
export default function CountdownBannerCard() {
  // 結束時間在初始化時算一次，不在 render 中呼叫 Date.now()
  const [end] = useState(() => new Date(Date.now() + 4 * 3_600_000 + 26 * 60_000));

  return (
    <div className="mx-auto w-72">
      <CountdownBanner
        language="en"
        title="Studio Headphones, launch week"
        subtitle=""
        discount="40% OFF"
        discountedPrice=""
        originalPrice=""
        ctaText=""
        endDate={end}
        className="[&>div]:gap-3 [&>div]:p-4 [&_.pt-5]:pt-3 [&_h2]:text-base"
      />
    </div>
  );
}
