"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ProductMedia } from "./product-media";

// 和完整 demo 同一組示範照片：馬克杯正面、側面與釉面微距
const sources = ["front", "side", "glaze"].map((name) => `/blocks/product-media/${name}.webp`);

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
