"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { RecapKeywordCloud, type RecapKeyword } from "./recap-keyword-cloud";

// 一年貼文裡最常出現的字，依次數由多到少
const counts = [64, 52, 41, 33, 24, 17, 11, 8];
const words = {
  en: ["coffee", "design", "Taipei", "cats", "side project", "rain", "ramen", "books"],
  "zh-TW": ["咖啡", "設計", "台北", "貓", "副業專案", "下雨", "拉麵", "讀書"],
  "zh-CN": ["咖啡", "设计", "台北", "猫", "副业项目", "下雨", "拉面", "读书"],
  ja: ["コーヒー", "デザイン", "台北", "猫", "個人開発", "雨", "ラーメン", "読書"],
};

// 限時動態上方的進度條：已看過的填滿，目前這張填一半
function ProgressStrip({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="mb-2 flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white" style={{ width: i < current ? "100%" : i === current ? "50%" : "0%" }} />
        </div>
      ))}
    </div>
  );
}

// 年度回顧裡的「關鍵字」那一張，放在 9:16 的限時動態卡片裡
export default function RecapKeywordCloudDemo() {
  const locale = useDemoLocale();
  const list = useDemoText(words);
  const keywords: RecapKeyword[] = list.map((word, i) => ({ word, count: counts[i] }));
  return (
    <div className="mx-auto w-full max-w-[340px] min-w-0 rounded-3xl bg-[#0f0f0f] p-2">
      <ProgressStrip current={4} total={12} />
      <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
        <RecapKeywordCloud keywords={keywords} locale={locale} />
      </div>
    </div>
  );
}
