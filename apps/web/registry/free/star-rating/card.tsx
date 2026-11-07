"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StarRating } from "./star-rating";

const copy = {
  en: {
    rate: "Rate it",
    yours: "Your rating",
    low: ["Canvas feels thin", "Loose stitching", "Shipping was slow"],
    high: ["Holds a lot", "Sturdy straps", "Good value"],
  },
  "zh-TW": {
    rate: "給個評分",
    yours: "你的評分",
    low: ["布料偏薄", "車線鬆脫", "物流太慢"],
    high: ["容量很大", "提把耐用", "CP 值高"],
  },
  "zh-CN": {
    rate: "打个分",
    yours: "你的评分",
    low: ["布料偏薄", "走线松脱", "物流太慢"],
    high: ["容量很大", "提手结实", "性价比高"],
  },
  ja: {
    rate: "評価する",
    yours: "あなたの評価",
    low: ["生地が薄い", "縫い目がほつれる", "配送が遅い"],
    high: ["たっぷり入る", "持ち手が丈夫", "コスパが良い"],
  },
};

/** 型錄卡片：已選 4 星的狀態，下方長出「喜歡哪裡」的理由標籤；改成 3 星以下會換成「哪裡不好」。 */
export default function StarRatingCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [mine, setMine] = useState(4);
  return (
    <div className="mx-auto w-64 rounded-md border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">4.4</span>
        <StarRating readOnly value={4.4} size="sm" locale={locale} />
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium">{t.rate}</p>
        <StarRating
          value={mine}
          onValueChange={setMine}
          size="lg"
          locale={locale}
          aria-label={t.yours}
          reasons={{ low: t.low, high: t.high }}
          defaultSelectedReasons={[t.high[0]]}
          className="mt-2"
        />
      </div>
    </div>
  );
}
