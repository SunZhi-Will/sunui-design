"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { OrbitGallery, type OrbitImage } from "./orbit-gallery";

// 示範圖：平面色塊上的中性物件線稿（SVG data URI），不讀外部圖片
const plates = ["#e9e4da", "#d8e2dc", "#f1e3d3", "#dfe7ef", "#ece2ec", "#e4e9d8"];
const ink = "#2b2b2b";
const objects = [
  // bottle
  `<rect x='170' y='70' width='60' height='40' rx='6' fill='${ink}'/><path d='M160 110 h80 v40 q30 20 30 60 v150 q0 20 -20 20 h-100 q-20 0 -20 -20 v-150 q0 -40 30 -60z' fill='none' stroke='${ink}' stroke-width='8'/>`,
  // tote bag
  `<path d='M150 150 q0 -70 50 -70 q50 0 50 70' fill='none' stroke='${ink}' stroke-width='8'/><rect x='110' y='150' width='180' height='200' rx='8' fill='none' stroke='${ink}' stroke-width='8'/>`,
  // mug
  `<rect x='120' y='130' width='140' height='180' rx='12' fill='none' stroke='${ink}' stroke-width='8'/><path d='M260 170 h30 q30 0 30 40 q0 40 -30 40 h-30' fill='none' stroke='${ink}' stroke-width='8'/>`,
  // hat
  `<path d='M140 240 q0 -120 60 -120 q60 0 60 120' fill='none' stroke='${ink}' stroke-width='8'/><ellipse cx='200' cy='250' rx='130' ry='26' fill='none' stroke='${ink}' stroke-width='8'/>`,
  // sunglasses
  `<circle cx='140' cy='220' r='50' fill='none' stroke='${ink}' stroke-width='8'/><circle cx='260' cy='220' r='50' fill='none' stroke='${ink}' stroke-width='8'/><path d='M190 215 q10 -12 20 0' fill='none' stroke='${ink}' stroke-width='8'/>`,
  // sneaker
  `<path d='M90 280 q0 -60 40 -80 l50 30 q60 30 130 30 q30 0 30 30 v20 h-250z' fill='none' stroke='${ink}' stroke-width='8'/><path d='M90 310 h250' stroke='${ink}' stroke-width='8'/>`,
];

function plate(i: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' preserveAspectRatio='xMidYMid slice'><rect width='400' height='400' fill='${plates[i % plates.length]}'/>${objects[i % objects.length]}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Copy = { eyebrow: string; heading: string; hint: string; label: string; picked: string; items: string[] };

const copy: { en: Copy } & Partial<Record<"zh-TW" | "zh-CN" | "ja", Copy>> = {
  en: {
    eyebrow: "Summer edit",
    heading: "Everything for the long weekend",
    hint: "Drag to spin, tap a piece to bring it forward",
    label: "Summer edit, 12 pieces",
    picked: "Selected:",
    items: ["Glass bottle", "Canvas tote", "Stoneware mug", "Straw hat", "Round sunglasses", "Canvas sneaker", "Travel bottle", "Market tote", "Camp mug", "Bucket hat", "Clip-on shades", "Slip-on sneaker"],
  },
  "zh-TW": {
    eyebrow: "夏日選品",
    heading: "連假出門，一次備齊",
    hint: "拖曳旋轉，點一件拉到前面",
    label: "夏日選品，共 12 件",
    picked: "目前選擇：",
    items: ["玻璃水瓶", "帆布托特包", "陶瓷馬克杯", "草編帽", "圓框墨鏡", "帆布鞋", "旅行水瓶", "市集提袋", "露營杯", "漁夫帽", "夾式墨鏡", "懶人鞋"],
  },
  "zh-CN": {
    eyebrow: "夏日选品",
    heading: "假期出门，一次备齐",
    hint: "拖动旋转，点一件拉到前面",
    label: "夏日选品，共 12 件",
    picked: "当前选择：",
    items: ["玻璃水瓶", "帆布托特包", "陶瓷马克杯", "草编帽", "圆框墨镜", "帆布鞋", "旅行水瓶", "市集提袋", "露营杯", "渔夫帽", "夹式墨镜", "一脚蹬"],
  },
  ja: {
    eyebrow: "サマーセレクト",
    heading: "連休のおでかけに、まとめてそろう",
    hint: "ドラッグで回転、タップで手前に",
    label: "サマーセレクト 全 12 点",
    picked: "選択中：",
    items: ["ガラスボトル", "キャンバストート", "陶器のマグ", "麦わら帽子", "丸型サングラス", "キャンバススニーカー", "トラベルボトル", "マルシェバッグ", "キャンプマグ", "バケットハット", "クリップサングラス", "スリッポン"],
  },
};

export default function OrbitGalleryDemo() {
  const t = useDemoText(copy);
  const images: OrbitImage[] = t.items.map((alt, i) => ({ src: plate(i), alt }));
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <section className="w-full max-w-3xl px-4 py-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-foreground">{t.heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      <OrbitGallery images={images} label={t.label} onSelect={(image) => setPicked(image.alt)} className="mt-4" />
      <p className="mt-2 h-5 text-sm text-foreground">
        {picked && (
          <>
            <span className="mr-1 text-muted-foreground">{t.picked}</span>
            {picked}
          </>
        )}
      </p>
    </section>
  );
}
