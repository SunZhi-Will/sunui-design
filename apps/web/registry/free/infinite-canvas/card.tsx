"use client";

import { useDemoText } from "@/lib/demo-locale";

import { InfiniteCanvas, type InfiniteCanvasItem } from "./infinite-canvas";

// Demo images: one set of grey-backdrop studio product shots in public/demo/products/
const photos = ["tote", "vase", "mug", "lamp", "cap", "notebook", "candle", "tea", "wallet", "scarf", "gloves", "watch"];
const photo = (i: number) => `/demo/products/${photos[i % photos.length]}.webp`;

const copy = {
  en: { label: "The everyday edit", names: ["Canvas tote", "Bud vase", "Stoneware mug", "Desk lamp", "Wool flat cap", "Leather journal", "Soy candle", "Sencha tin", "Leather wallet"] },
  "zh-TW": { label: "日常選物", names: ["帆布托特包", "小花器", "石陶馬克杯", "桌燈", "羊毛報童帽", "皮革手帳", "大豆蠟燭", "煎茶罐", "皮革短夾"] },
  "zh-CN": { label: "日常选物", names: ["帆布托特包", "小花器", "石陶马克杯", "台灯", "羊毛报童帽", "皮革手账", "大豆蜡烛", "煎茶罐", "皮革短夹"] },
  ja: { label: "日常のセレクト", names: ["キャンバストート", "一輪挿し", "陶器のマグ", "デスクランプ", "ウールのハンチング", "革の手帳", "ソイキャンドル", "煎茶の缶", "革の財布"] },
};

/** Catalog card: an endlessly extending product wall that drifts slowly; drag in any direction, click an item to enlarge it. */
export default function InfiniteCanvasCard() {
  const t = useDemoText(copy);
  const items: InfiniteCanvasItem[] = t.names.map((name, i) => ({ id: String(i), src: photo(i), alt: name, label: name, caption: name }));
  return (
    <div className="w-[340px]">
      <InfiniteCanvas
        items={items}
        label={t.label}
        cellWidth={110}
        cellHeight={138}
        gap={12}
        className="h-[250px] rounded-xl border border-border bg-muted/40"
      />
    </div>
  );
}
