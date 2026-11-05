"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StarRating } from "./star-rating";

const copy = {
  en: { rate: "Rate it", yours: "Your rating" },
  "zh-TW": { rate: "給個評分", yours: "你的評分" },
  "zh-CN": { rate: "打个分", yours: "你的评分" },
  ja: { rate: "評価する", yours: "あなたの評価" },
};

/** 型錄卡片：滑過星星預覽分數，點下去像蓋章一樣壓下，支援半星。 */
export default function StarRatingCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [mine, setMine] = useState(0);
  return (
    <div className="mx-auto w-64 rounded-md border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">4.4</span>
        <StarRating readOnly value={4.4} size="sm" locale={locale} />
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium">{t.rate}</p>
        <StarRating value={mine} onValueChange={setMine} precision={0.5} size="lg" locale={locale} aria-label={t.yours} className="mt-2" />
      </div>
    </div>
  );
}
