"use client";

import { useDemoText } from "@/lib/demo-locale";

import { RibbonCarousel, type RibbonItem } from "./ribbon-carousel";

// 與 demo 相同：平面色塊上的單品線稿（SVG data URI）
const plates: [string, string][] = [
  ["#e8e1d5", "#3a3631"],
  ["#d9e0d4", "#2f3a2c"],
  ["#e6dcd8", "#3d2f2b"],
  ["#d6dde4", "#26323d"],
  ["#ebe4cf", "#3b3524"],
  ["#dcd6e2", "#302a38"],
];

const garments = [
  (c: string) => `<path d='M150 90 l50 30 l50 -30 l60 40 l-20 70 l-20 -10 v230 h-140 v-230 l-20 10 l-20 -70z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M200 120 v300' stroke='${c}' stroke-width='4'/>`,
  (c: string) => `<path d='M170 90 h60 l10 70 l60 260 h-200 l60 -260z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M160 180 h80' stroke='${c}' stroke-width='4'/>`,
  (c: string) => `<path d='M140 110 q60 -30 120 0 l60 50 l-25 45 l-25 -20 v190 h-140 v-190 l-25 20 l-25 -45z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M140 360 h120 M140 375 h120' stroke='${c}' stroke-width='3'/>`,
  (c: string) => `<path d='M140 90 h120 l20 330 h-60 l-20 -230 l-20 230 h-60z' fill='none' stroke='${c}' stroke-width='6' stroke-linejoin='round'/><path d='M140 115 h120' stroke='${c}' stroke-width='4'/>`,
];

function plate(i: number) {
  const [bg, c] = plates[i % plates.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 520' preserveAspectRatio='xMidYMid slice'><rect width='400' height='520' fill='${bg}'/>${garments[i % garments.length](c)}<rect x='28' y='472' width='70' height='4' fill='${c}' opacity='.5'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const copy = {
  en: { label: "Autumn looks", previous: "Previous look", next: "Next look", looks: ["Wool wrap coat", "Pleated midi dress", "Ribbed crew knit", "Wide-leg trousers", "Car coat in sand", "Slip dress"] },
  "zh-TW": { label: "秋季穿搭", previous: "上一套", next: "下一套", looks: ["羊毛綁帶大衣", "百褶中長洋裝", "羅紋圓領針織", "寬褲", "沙色短大衣", "細肩帶洋裝"] },
  "zh-CN": { label: "秋季穿搭", previous: "上一套", next: "下一套", looks: ["羊毛系带大衣", "百褶中长连衣裙", "罗纹圆领针织", "阔腿裤", "沙色短大衣", "吊带裙"] },
  ja: { label: "秋のルック", previous: "前のルック", next: "次のルック", looks: ["ウールラップコート", "プリーツミディワンピース", "リブクルーニット", "ワイドパンツ", "サンドのカーコート", "スリップドレス"] },
};

/** 型錄卡片：穿搭照片沿著弧面排開，自動輪播，拖曳或按箭頭換下一套。 */
export default function RibbonCarouselCard() {
  const t = useDemoText(copy);
  const items: RibbonItem[] = t.looks.map((title, i) => ({ src: plate(i), alt: title, title }));
  return (
    <div className="w-[320px]">
      <RibbonCarousel
        items={items}
        label={t.label}
        labels={{ previous: t.previous, next: t.next }}
        cardWidth={136}
        cardHeight={180}
        radius={380}
        gap={14}
        autoplay
      />
    </div>
  );
}
