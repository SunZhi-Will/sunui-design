"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeRating } from "./anime-rating";

const copy = {
  en: { label: "Rate episode 12", star: (n: number) => `${n} star${n > 1 ? "s" : ""}`, thanks: (n: number) => `Thanks, you gave it ${n} of 5.` },
  "zh-TW": { label: "為第 12 話評分", star: (n: number) => `${n} 顆星`, thanks: (n: number) => `謝謝，你給了 ${n} 顆星。` },
  "zh-CN": { label: "为第 12 话评分", star: (n: number) => `${n} 颗星`, thanks: (n: number) => `谢谢，你给了 ${n} 颗星。` },
  ja: { label: "第12話を評価", star: (n: number) => `星 ${n}`, thanks: (n: number) => `ありがとうございます。星 ${n} つです。` },
};

export default function AnimeRatingDemo() {
  const t = useDemoText(copy);
  const [value, setValue] = useState(0);
  return (
    <div className="w-full max-w-xs px-2 py-16">
      <AnimeRating label={t.label} value={value} onValueChange={setValue} starLabel={t.star} name="rating" />
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-muted-foreground">
        {value ? t.thanks(value) : ""}
      </p>
    </div>
  );
}
