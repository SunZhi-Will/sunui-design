"use client";

import { useState } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardImage } from "./classic-card";

// 以 inline SVG 做封面，不用外部圖片
const cover = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="560" cy="170" r="120" fill="#fff" fill-opacity=".18"/><rect x="140" y="250" width="300" height="120" rx="24" fill="#fff" fill-opacity=".22"/></svg>`,
)}`;

export default function ClassicCardDemo() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="w-full max-w-sm min-w-0">
      <Card variant="elevated" theme="violet" glow className="group min-w-0">
        <CardImage src={cover} alt="Wireless headphones cover" overlay overlayGradient="bottom" />
        <CardHeader showDivider>
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xl font-bold">Studio Headphones</h4>
              <p className="mt-1 text-sm opacity-70">Wireless, 40h battery</p>
            </div>
            <span className="shrink-0 rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold text-white">NEW</span>
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
            Buy now
          </button>
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
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
