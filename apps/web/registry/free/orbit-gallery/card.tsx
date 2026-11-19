"use client";

import { useDemoText } from "@/lib/demo-locale";

import { OrbitGallery, type OrbitImage } from "./orbit-gallery";

// 示範圖：同一組灰底棚拍商品照，放在 public/blocks/orbit-gallery/
const photos = ["mug", "tote", "lamp", "bottle", "vase", "candle", "notebook", "tea", "backpack", "watch", "wallet", "scarf"];
const photo = (i: number) => `/blocks/orbit-gallery/${photos[i % photos.length]}.webp`;

const copy = {
  en: { label: "The everyday edit, 6 pieces", items: ["Stoneware mug", "Canvas tote", "Desk lamp", "Steel bottle", "Bud vase", "Soy candle"] },
  "zh-TW": { label: "日常選物，共 6 件", items: ["石陶馬克杯", "帆布托特包", "桌燈", "不鏽鋼水壺", "小花器", "大豆蠟燭"] },
  "zh-CN": { label: "日常选物，共 6 件", items: ["石陶马克杯", "帆布托特包", "台灯", "不锈钢水壶", "小花器", "大豆蜡烛"] },
  ja: { label: "日常のセレクト 全 6 点", items: ["陶器のマグ", "キャンバストート", "デスクランプ", "ステンレスボトル", "一輪挿し", "ソイキャンドル"] },
};

/** 型錄卡片：商品圖排成一顆會自轉的球，拖曳旋轉，點一張轉到正面。 */
export default function OrbitGalleryCard() {
  const t = useDemoText(copy);
  const images: OrbitImage[] = t.items.map((alt, i) => ({ src: photo(i), alt }));
  return (
    <div className="w-[300px]">
      <OrbitGallery images={images} label={t.label} radius={112} tileSize={60} count={24} />
    </div>
  );
}
