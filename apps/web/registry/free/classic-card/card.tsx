"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Card, CardContent, CardFooter, CardHeader } from "./classic-card";

const copy = {
  en: { title: "Studio Headphones", subtitle: "Wireless, 40h battery", badge: "NEW", buy: "Buy now", add: "Add to wishlist", remove: "Remove from wishlist", cover: "Wireless headphones cover" },
  "zh-TW": { title: "錄音室耳機", subtitle: "無線，續航 40 小時", badge: "新品", buy: "立即購買", add: "加入願望清單", remove: "移出願望清單", cover: "無線耳機封面" },
  "zh-CN": { title: "录音室耳机", subtitle: "无线，续航 40 小时", badge: "新品", buy: "立即购买", add: "加入心愿单", remove: "移出心愿单", cover: "无线耳机封面" },
  ja: { title: "スタジオヘッドホン", subtitle: "ワイヤレス、40 時間再生", badge: "NEW", buy: "今すぐ購入", add: "ウィッシュリストに追加", remove: "ウィッシュリストから削除", cover: "ワイヤレスヘッドホンのカバー" },
};

/** 型錄卡片：一張經典商品卡，滑過會微微放大並亮起光暈，愛心可切換收藏。 */
export default function ClassicCardCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto w-64">
      <Card variant="elevated" theme="violet" size="sm" glow locale={locale} className="group min-w-0">
        <CardHeader showDivider>
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-lg font-bold">{t.title}</h4>
              <p className="mt-1 text-sm opacity-70">{t.subtitle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-violet-500 px-2.5 py-1 text-xs font-semibold text-white">{t.badge}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <p className="text-2xl font-bold text-violet-600 tabular-nums">NT$ 1,299</p>
            <p className="pb-1 text-sm line-through opacity-50 tabular-nums">NT$ 1,999</p>
          </div>
        </CardContent>
        <CardFooter justify="between" className="gap-3">
          <button
            type="button"
            className="rounded-lg bg-linear-to-r from-violet-500 to-purple-600 px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:from-violet-600 hover:to-purple-700 hover:shadow-xl"
          >
            {t.buy}
          </button>
          <button
            type="button"
            aria-label={saved ? t.remove : t.add}
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className="rounded-lg border border-violet-300 px-3.5 py-2.5 text-violet-600 transition-all hover:bg-violet-50"
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
