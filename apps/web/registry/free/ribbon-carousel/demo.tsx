"use client";

import { useDemoText } from "@/lib/demo-locale";

import { RibbonCarousel, type RibbonItem } from "./ribbon-carousel";

// 示範圖：平面色塊上的單品線稿（SVG data URI），不讀外部圖片
const plates: [string, string][] = [
  ["#e8e1d5", "#3a3631"],
  ["#d9e0d4", "#2f3a2c"],
  ["#e6dcd8", "#3d2f2b"],
  ["#d6dde4", "#26323d"],
  ["#ebe4cf", "#3b3524"],
  ["#dcd6e2", "#302a38"],
  ["#e2ddd3", "#2c2c2c"],
  ["#d3e0de", "#24363a"],
];

const garments = [
  // coat
  (c: string) => `<path d='M150 90 l50 30 l50 -30 l60 40 l-20 70 l-20 -10 v230 h-140 v-230 l-20 10 l-20 -70z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M200 120 v300' stroke='${c}' stroke-width='4'/>`,
  // dress
  (c: string) => `<path d='M170 90 h60 l10 70 l60 260 h-200 l60 -260z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M160 180 h80' stroke='${c}' stroke-width='4'/>`,
  // knit
  (c: string) => `<path d='M140 110 q60 -30 120 0 l60 50 l-25 45 l-25 -20 v190 h-140 v-190 l-25 20 l-25 -45z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M140 360 h120 M140 375 h120' stroke='${c}' stroke-width='3'/>`,
  // trousers
  (c: string) => `<path d='M140 90 h120 l20 330 h-60 l-20 -230 l-20 230 h-60z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M140 115 h120' stroke='${c}' stroke-width='4'/>`,
];

function plate(i: number) {
  const [bg, c] = plates[i % plates.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 520' preserveAspectRatio='xMidYMid slice'><rect width='400' height='520' fill='${bg}'/>${garments[i % garments.length](c)}<rect x='28' y='472' width='70' height='4' fill='${c}' opacity='.5'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Copy = { eyebrow: string; heading: string; label: string; previous: string; next: string; looks: string[] };

const copy: { en: Copy } & Partial<Record<"zh-TW" | "zh-CN" | "ja", Copy>> = {
  en: {
    eyebrow: "New arrivals",
    heading: "The autumn line, look by look",
    label: "Autumn looks",
    previous: "Previous look",
    next: "Next look",
    looks: ["Wool wrap coat", "Pleated midi dress", "Ribbed crew knit", "Wide-leg trousers", "Car coat in sand", "Slip dress", "Mohair cardigan", "Pressed cigarette pants"],
  },
  "zh-TW": {
    eyebrow: "新品上市",
    heading: "秋季系列，一套一套看",
    label: "秋季穿搭",
    previous: "上一套",
    next: "下一套",
    looks: ["羊毛綁帶大衣", "百褶中長洋裝", "羅紋圓領針織", "寬褲", "沙色短大衣", "細肩帶洋裝", "馬海毛開襟衫", "直筒煙管褲"],
  },
  "zh-CN": {
    eyebrow: "新品上市",
    heading: "秋季系列，一套一套看",
    label: "秋季穿搭",
    previous: "上一套",
    next: "下一套",
    looks: ["羊毛系带大衣", "百褶中长连衣裙", "罗纹圆领针织", "阔腿裤", "沙色短大衣", "吊带裙", "马海毛开衫", "直筒烟管裤"],
  },
  ja: {
    eyebrow: "新作",
    heading: "秋のコレクションを、ルックごとに",
    label: "秋のルック",
    previous: "前のルック",
    next: "次のルック",
    looks: ["ウールラップコート", "プリーツミディワンピース", "リブクルーニット", "ワイドパンツ", "サンドのカーコート", "スリップドレス", "モヘアカーディガン", "センタープレスパンツ"],
  },
};

export default function RibbonCarouselDemo() {
  const t = useDemoText(copy);
  const items: RibbonItem[] = t.looks.map((title, i) => ({ src: plate(i), alt: title, title }));

  return (
    <section className="w-full max-w-5xl px-4 py-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-foreground">{t.heading}</h2>
      <RibbonCarousel
        items={items}
        label={t.label}
        labels={{ previous: t.previous, next: t.next }}
        cardWidth={220}
        cardHeight={290}
        className="mt-6"
      />
    </section>
  );
}
