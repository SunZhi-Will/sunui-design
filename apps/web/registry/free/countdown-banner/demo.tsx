"use client";

import { useState } from "react";

import { CountdownBanner } from "./countdown-banner";

export default function CountdownBannerDemo() {
  // 結束時間在初始化時算一次，不在 render 中呼叫 Date.now()
  const [dates] = useState(() => ({
    days: new Date(Date.now() + 3 * 86_400_000 + 5 * 3_600_000 + 12 * 60_000),
    hours: new Date(Date.now() + 4 * 3_600_000 + 26 * 60_000),
    past: new Date(Date.now() - 3_600_000),
  }));

  return (
    <div className="w-full max-w-[60rem] space-y-4">
      <CountdownBanner
        language="en"
        title="Studio Headphones, launch week"
        subtitle="Launch price for the first week, then back to $129."
        discount="40% OFF"
        discountedPrice="$77"
        originalPrice="$129"
        ctaText="Shop headphones"
        ctaHref="#"
        endDate={dates.days}
      />
      <CountdownBanner
        language="zh"
        title="雙十一限定：保溫瓶第二件 6 折"
        subtitle="結帳自動折抵，不需輸入優惠碼。"
        discount="6 折"
        discountedPrice="NT$594"
        originalPrice="NT$990"
        ctaText="立即選購"
        ctaHref="#"
        endDate={dates.hours}
      />
      <CountdownBanner
        language="en"
        title="Desk Lamp, weekend price"
        subtitle="This offer has ended. The lamp is still available at the regular price."
        discount="25% OFF"
        discountedPrice="$66"
        originalPrice="$88"
        ctaText="Shop lamps"
        endDate={dates.past}
      />
    </div>
  );
}
