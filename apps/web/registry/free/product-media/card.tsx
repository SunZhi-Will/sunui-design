"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ProductMedia } from "./product-media";

// 和完整 demo 同一組線稿：馬克杯正面、側面與釉面特寫
function svg(body: string) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#eaeaea"/><g fill="none" stroke="#171717" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(doc)}`;
}

const sources = [
  svg('<ellipse cx="200" cy="330" rx="120" ry="14" stroke-opacity=".25"/><path d="M120 170h160v140a20 20 0 0 1-20 20H140a20 20 0 0 1-20-20z" fill="#f7f7f7"/><ellipse cx="200" cy="170" rx="80" ry="12" fill="#f7f7f7"/><path d="M280 200h22a26 26 0 0 1 0 52h-22"/><path d="M150 230h100" stroke-opacity=".3"/>'),
  svg('<ellipse cx="200" cy="330" rx="110" ry="14" stroke-opacity=".25"/><path d="M135 170h130v140a20 20 0 0 1-20 20h-90a20 20 0 0 1-20-20z" fill="#f7f7f7"/><ellipse cx="200" cy="170" rx="65" ry="12" fill="#f7f7f7"/><path d="M200 210v80" stroke-opacity=".3"/>'),
  svg('<path d="M40 120c80-20 240-20 320 0v300c-80 20-240 20-320 0z" fill="#f7f7f7"/><path d="M70 200c50 10 90-8 140 4s100 6 120-6M70 260c60 8 100-6 150 6s80 2 110-8M70 320c40 6 110-10 160 2s70 4 100-4" stroke-opacity=".35"/>'),
];

const copy = {
  en: { name: "Stoneware mug", price: "$24", note: "Hover for the side, click to zoom.", alts: ["Stoneware mug, front", "Stoneware mug, side", "Glaze close-up"], tag: "New" },
  "zh-TW": { name: "石器馬克杯", price: "$24", note: "滑過看側面，點一下放大。", alts: ["石器馬克杯正面", "石器馬克杯側面", "釉面特寫"], tag: "新品" },
  "zh-CN": { name: "石器马克杯", price: "$24", note: "悬停看侧面，点击放大。", alts: ["石器马克杯正面", "石器马克杯侧面", "釉面特写"], tag: "新品" },
  ja: { name: "ストーンウェアのマグ", price: "$24", note: "ホバーで側面、クリックで拡大。", alts: ["ストーンウェアのマグ 正面", "ストーンウェアのマグ 側面", "釉薬のクローズアップ"], tag: "新着" },
};

/** 型錄卡片：商品主圖，滑過換側面角度、點一下跟著游標放大，下方圓點切換三張圖。 */
export default function ProductMediaCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const images = sources.map((src, i) => ({ src, alt: t.alts[i] }));

  return (
    <div className="mx-auto grid w-80 grid-cols-[11rem_1fr] gap-4">
      <ProductMedia
        locale={locale}
        images={images}
        badge={<span className="rounded-sm bg-background px-1.5 py-0.5 text-[11px] font-medium tracking-[0.12em] uppercase">{t.tag}</span>}
      />
      <div className="flex flex-col gap-1 pt-1">
        <p className="font-semibold tracking-tight">{t.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">{t.price}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t.note}</p>
      </div>
    </div>
  );
}
