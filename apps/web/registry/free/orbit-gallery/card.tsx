"use client";

import { useDemoText } from "@/lib/demo-locale";

import { OrbitGallery, type OrbitImage } from "./orbit-gallery";

// 與 demo 相同：平面色塊上的物件線稿（SVG data URI）
const plates = ["#e9e4da", "#d8e2dc", "#f1e3d3", "#dfe7ef", "#ece2ec", "#e4e9d8"];
const ink = "#2b2b2b";
const objects = [
  `<rect x='170' y='70' width='60' height='40' rx='6' fill='${ink}'/><path d='M160 110 h80 v40 q30 20 30 60 v150 q0 20 -20 20 h-100 q-20 0 -20 -20 v-150 q0 -40 30 -60z' fill='none' stroke='${ink}' stroke-width='8'/>`,
  `<path d='M150 150 q0 -70 50 -70 q50 0 50 70' fill='none' stroke='${ink}' stroke-width='8'/><rect x='110' y='150' width='180' height='200' rx='8' fill='none' stroke='${ink}' stroke-width='8'/>`,
  `<rect x='120' y='130' width='140' height='180' rx='12' fill='none' stroke='${ink}' stroke-width='8'/><path d='M260 170 h30 q30 0 30 40 q0 40 -30 40 h-30' fill='none' stroke='${ink}' stroke-width='8'/>`,
  `<path d='M140 240 q0 -120 60 -120 q60 0 60 120' fill='none' stroke='${ink}' stroke-width='8'/><ellipse cx='200' cy='250' rx='130' ry='26' fill='none' stroke='${ink}' stroke-width='8'/>`,
  `<circle cx='140' cy='220' r='50' fill='none' stroke='${ink}' stroke-width='8'/><circle cx='260' cy='220' r='50' fill='none' stroke='${ink}' stroke-width='8'/><path d='M190 215 q10 -12 20 0' fill='none' stroke='${ink}' stroke-width='8'/>`,
  `<path d='M90 280 q0 -60 40 -80 l50 30 q60 30 130 30 q30 0 30 30 v20 h-250z' fill='none' stroke='${ink}' stroke-width='8'/><path d='M90 310 h250' stroke='${ink}' stroke-width='8'/>`,
];

function plate(i: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' preserveAspectRatio='xMidYMid slice'><rect width='400' height='400' fill='${plates[i % plates.length]}'/>${objects[i % objects.length]}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const copy = {
  en: { label: "Summer edit, 6 pieces", items: ["Glass bottle", "Canvas tote", "Stoneware mug", "Straw hat", "Round sunglasses", "Canvas sneaker"] },
  "zh-TW": { label: "夏日選品，共 6 件", items: ["玻璃水瓶", "帆布托特包", "陶瓷馬克杯", "草編帽", "圓框墨鏡", "帆布鞋"] },
  "zh-CN": { label: "夏日选品，共 6 件", items: ["玻璃水瓶", "帆布托特包", "陶瓷马克杯", "草编帽", "圆框墨镜", "帆布鞋"] },
  ja: { label: "サマーセレクト 全 6 点", items: ["ガラスボトル", "キャンバストート", "陶器のマグ", "麦わら帽子", "丸型サングラス", "キャンバススニーカー"] },
};

/** 型錄卡片：商品圖排成一顆會自轉的球，拖曳旋轉，點一張轉到正面。 */
export default function OrbitGalleryCard() {
  const t = useDemoText(copy);
  const images: OrbitImage[] = t.items.map((alt, i) => ({ src: plate(i), alt }));
  return (
    <div className="w-[300px]">
      <OrbitGallery images={images} label={t.label} radius={112} tileSize={70} count={24} />
    </div>
  );
}
