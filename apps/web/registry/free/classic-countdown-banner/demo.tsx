"use client";

import { useState } from "react";

import { ClassicCountdownBanner } from "./classic-countdown-banner";

const DAY = 24 * 60 * 60 * 1000;

export default function ClassicCountdownBannerDemo() {
  // 結束時間在初始化時算一次
  const [endDate] = useState(() => new Date(Date.now() + 3 * DAY));

  return (
    <div className="w-full max-w-4xl min-w-0">
      <ClassicCountdownBanner
        language="en"
        title="Limited Time Offer"
        subtitle="Hurry, offer ends soon!"
        discount="40% OFF"
        originalPrice="$1,199"
        discountedPrice="$719"
        ctaText="Shop Now"
        endDate={endDate}
      />
    </div>
  );
}
