"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Card, CardContent, CardFooter, CardHeader, CardImage } from "./classic-card";

const copy = {
  en: { title: "Studio Headphones", subtitle: "Wireless, 40h battery", badge: "NEW", buy: "Buy now", add: "Add to wishlist", remove: "Remove from wishlist", cover: "Wireless headphones cover" },
  "zh-TW": { title: "錄音室耳機", subtitle: "無線，續航 40 小時", badge: "新品", buy: "立即購買", add: "加入願望清單", remove: "移出願望清單", cover: "無線耳機封面" },
  "zh-CN": { title: "录音室耳机", subtitle: "无线，续航 40 小时", badge: "新品", buy: "立即购买", add: "加入心愿单", remove: "移出心愿单", cover: "无线耳机封面" },
  ja: { title: "スタジオヘッドホン", subtitle: "ワイヤレス、40 時間再生", badge: "NEW", buy: "今すぐ購入", add: "ウィッシュリストに追加", remove: "ウィッシュリストから削除", cover: "ワイヤレスヘッドホンのカバー" },
};

// 以 inline SVG 做封面，不用外部圖片
const cover = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="560" cy="170" r="120" fill="#fff" fill-opacity=".18"/><rect x="140" y="250" width="300" height="120" rx="24" fill="#fff" fill-opacity=".22"/></svg>`,
)}`;

export default function ClassicCardDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [saved, setSaved] = useState(false);

  return (
    <div className="w-full max-w-sm min-w-0">
      <Card variant="elevated" theme="violet" glow locale={locale} className="group min-w-0">
        <CardImage src={cover} alt={t.cover} overlay overlayGradient="bottom" />
        <CardHeader showDivider>
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xl font-bold">{t.title}</h4>
              <p className="mt-1 text-sm opacity-70">{t.subtitle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold text-white">{t.badge}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-violet-600">NT$ 1,299</p>
            <p className="pb-1 text-sm line-through opacity-50">NT$ 1,999</p>
          </div>
        </CardContent>
        <CardFooter justify="between" className="gap-3">
          <button
            type="button"
            className="rounded-lg bg-linear-to-r from-violet-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-600 hover:to-purple-700 hover:shadow-xl"
          >
            {t.buy}
          </button>
          <button
            type="button"
            aria-label={saved ? t.remove : t.add}
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className="rounded-lg border border-violet-300 px-4 py-3 text-violet-600 transition-all hover:bg-violet-50"
          >
            <svg className="h-5 w-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
