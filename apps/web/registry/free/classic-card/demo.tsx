"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Card, CardContent, CardFooter, CardHeader, CardImage, cardAccentClass } from "./classic-card";

const copy = {
  en: { title: "Studio Headphones", subtitle: "Wireless, 40h battery", badge: "NEW", buy: "Buy now", add: "Add to wishlist", remove: "Remove from wishlist", cover: "Wireless headphones cover" },
  "zh-TW": { title: "錄音室耳機", subtitle: "無線，續航 40 小時", badge: "新品", buy: "立即購買", add: "加入願望清單", remove: "移出願望清單", cover: "無線耳機封面" },
  "zh-CN": { title: "录音室耳机", subtitle: "无线，续航 40 小时", badge: "新品", buy: "立即购买", add: "加入心愿单", remove: "移出心愿单", cover: "无线耳机封面" },
  ja: { title: "スタジオヘッドホン", subtitle: "ワイヤレス、40 時間再生", badge: "NEW", buy: "今すぐ購入", add: "ウィッシュリストに追加", remove: "ウィッシュリストから削除", cover: "ワイヤレスヘッドホンのカバー" },
};

// 以 inline SVG 做封面，不用外部圖片；中性石色加上簡單的耳機線稿
const cover = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#e7e5e4"/><rect y="330" width="800" height="120" fill="#d6d3d1"/><path d="M290 270v-40a110 110 0 0 1 220 0v40" fill="none" stroke="#57534e" stroke-width="18" stroke-linecap="round"/><rect x="262" y="250" width="56" height="96" rx="22" fill="#44403c"/><rect x="482" y="250" width="56" height="96" rx="22" fill="#44403c"/></svg>`,
)}`;

export default function ClassicCardDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [saved, setSaved] = useState(false);

  return (
    <div className="w-full max-w-sm min-w-0">
      <Card variant="elevated" theme="orange" locale={locale} className="group min-w-0">
        <CardImage src={cover} alt={t.cover} overlay overlayGradient="bottom" />
        <CardHeader showDivider>
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xl font-semibold">{t.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">{t.badge}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className={`text-3xl font-semibold tabular-nums ${cardAccentClass("orange")}`}>NT$ 1,299</p>
            <p className="pb-1 text-sm text-muted-foreground line-through tabular-nums">NT$ 1,999</p>
          </div>
        </CardContent>
        <CardFooter justify="between" className="gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t.buy}
          </button>
          <button
            type="button"
            aria-label={saved ? t.remove : t.add}
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className="rounded-md border border-border px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
          >
            <svg className="h-5 w-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
