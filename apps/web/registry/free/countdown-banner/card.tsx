"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CountdownBanner } from "./countdown-banner";

const copy = {
  en: { title: "Studio Headphones, launch week", discount: "40% OFF" },
  "zh-TW": { title: "錄音室耳機，上市週", discount: "6 折" },
  "zh-CN": { title: "录音室耳机，上市周", discount: "6 折" },
  ja: { title: "スタジオヘッドホン、発売記念週間", discount: "40% OFF" },
};

/** Catalog card: a limited-time offer, showing only the paper flip-clock digits turning down each second. */
export default function CountdownBannerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // The end time is computed once at init, so Date.now() is not called during render
  const [end] = useState(() => new Date(Date.now() + 4 * 3_600_000 + 26 * 60_000));

  return (
    <div className="mx-auto w-72">
      <CountdownBanner
        locale={locale}
        title={t.title}
        subtitle=""
        discount={t.discount}
        discountedPrice=""
        originalPrice=""
        ctaText=""
        endDate={end}
        className="[&>div]:gap-3 [&>div]:p-4 [&_.pt-5]:pt-3 [&_h2]:text-base"
      />
    </div>
  );
}
