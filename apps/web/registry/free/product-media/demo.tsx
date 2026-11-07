"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ProductMedia } from "./product-media";

// 示範照片（AI 生成）：同一個石器馬克杯的正面、側面與釉面微距，放在 public/blocks/product-media
const dir = "/blocks/product-media";
const front = `${dir}/front.webp`;
const side = `${dir}/side.webp`;
const detail = `${dir}/glaze.webp`;

const copy = {
  en: {
    name: "Stoneware mug, 350 ml",
    price: "$24",
    note: "Hover to see the side, click to zoom into the glaze.",
    alts: ["Stoneware mug, front", "Stoneware mug, side", "Glaze close-up"],
    tag: "New",
  },
  "zh-TW": {
    name: "石器馬克杯 350 ml",
    price: "$24",
    note: "滑過看側面，點一下放大看釉色。",
    alts: ["石器馬克杯正面", "石器馬克杯側面", "釉面特寫"],
    tag: "新品",
  },
  "zh-CN": {
    name: "石器马克杯 350 ml",
    price: "$24",
    note: "悬停查看侧面，点击放大查看釉色。",
    alts: ["石器马克杯正面", "石器马克杯侧面", "釉面特写"],
    tag: "新品",
  },
  ja: {
    name: "ストーンウェアのマグ 350 ml",
    price: "$24",
    note: "ホバーで側面、クリックで釉薬を拡大できます。",
    alts: ["ストーンウェアのマグ 正面", "ストーンウェアのマグ 側面", "釉薬のクローズアップ"],
    tag: "新着",
  },
};

export default function ProductMediaDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const images = [front, side, detail].map((src, i) => ({ src, alt: t.alts[i] }));

  return (
    <div className="grid w-full max-w-[44rem] gap-6 sm:grid-cols-[minmax(0,20rem)_1fr]">
      <ProductMedia
        locale={locale}
        images={images}
        badge={<span className="rounded-sm bg-background px-1.5 py-0.5 text-[11px] font-medium tracking-[0.12em] uppercase">{t.tag}</span>}
      />
      <div className="flex flex-col gap-1 pt-1">
        <p className="text-lg font-semibold tracking-tight">{t.name}</p>
        <p className="text-muted-foreground tabular-nums">{t.price}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t.note}</p>
      </div>
    </div>
  );
}
