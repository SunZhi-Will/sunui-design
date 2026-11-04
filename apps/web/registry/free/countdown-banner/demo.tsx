"use client";

import { useState } from "react";

import { CountdownBanner } from "./countdown-banner";

export default function CountdownBannerDemo() {
  const [endDate] = useState(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
  );

  return (
    <CountdownBanner
      title="Launch Week Sale"
      subtitle="Ends when the timer hits zero"
      discount="40% OFF"
      originalPrice="$129"
      discountedPrice="$77"
      ctaText="Claim the deal"
      endDate={endDate}
      language="en"
      theme="gradient"
    />
  );
}
