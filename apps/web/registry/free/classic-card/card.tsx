"use client";

import { useState } from "react";

import { Card, CardContent, CardFooter, CardHeader } from "./classic-card";

/** 型錄卡片：一張經典商品卡，滑過會微微放大並亮起光暈，愛心可切換收藏。 */
export default function ClassicCardCard() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto w-64">
      <Card variant="elevated" theme="violet" size="sm" glow className="group min-w-0">
        <CardHeader showDivider>
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-lg font-bold">Studio Headphones</h4>
              <p className="mt-1 text-sm opacity-70">Wireless, 40h battery</p>
            </div>
            <span className="shrink-0 rounded-full bg-violet-500 px-2.5 py-1 text-xs font-semibold text-white">NEW</span>
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
            Buy now
          </button>
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
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
