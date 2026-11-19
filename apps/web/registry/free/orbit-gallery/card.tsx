"use client";

import { useDemoText } from "@/lib/demo-locale";

import { OrbitGallery, type OrbitImage } from "./orbit-gallery";

// Demo images: one set of studio product photos on a grey background, stored in public/blocks/orbit-gallery/
const photos = ["mug", "tote", "lamp", "bottle", "vase", "candle", "notebook", "tea", "backpack", "watch", "wallet", "scarf"];
const photo = (i: number) => `/blocks/orbit-gallery/${photos[i % photos.length]}.webp`;

const copy = {
  en: { label: "The everyday edit, 6 pieces", items: ["Stoneware mug", "Canvas tote", "Desk lamp", "Steel bottle", "Bud vase", "Soy candle"] },
  "zh-TW": { label: "日常選物，共 6 件", items: ["石陶馬克杯", "帆布托特包", "桌燈", "不鏽鋼水壺", "小花器", "大豆蠟燭"] },
  "zh-CN": { label: "日常选物，共 6 件", items: ["石陶马克杯", "帆布托特包", "台灯", "不锈钢水壶", "小花器", "大豆蜡烛"] },
  ja: { label: "日常のセレクト 全 6 点", items: ["陶器のマグ", "キャンバストート", "デスクランプ", "ステンレスボトル", "一輪挿し", "ソイキャンドル"] },
};

/** Catalog card: product images arranged into a self-rotating sphere; drag to rotate, tap one to bring it to the front. */
export default function OrbitGalleryCard() {
  const t = useDemoText(copy);
  const images: OrbitImage[] = t.items.map((alt, i) => ({ src: photo(i), alt }));
  return (
    <div className="w-[300px]">
      <OrbitGallery images={images} label={t.label} radius={112} tileSize={60} count={24} />
    </div>
  );
}
