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

/** 型錄卡片：一條限時優惠，只看紙上翻頁數字每秒翻下的倒數。 */
export default function CountdownBannerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 結束時間在初始化時算一次，不在 render 中呼叫 Date.now()
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
