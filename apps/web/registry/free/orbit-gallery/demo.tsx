"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { OrbitGallery, type OrbitImage } from "./orbit-gallery";

// Demo images: one set of studio product photos on a grey background, stored in public/blocks/orbit-gallery/
const photos = ["mug", "tote", "lamp", "bottle", "vase", "candle", "notebook", "tea", "backpack", "watch", "wallet", "scarf"];
const photo = (i: number) => `/blocks/orbit-gallery/${photos[i % photos.length]}.webp`;

type Copy = { eyebrow: string; heading: string; hint: string; label: string; picked: string; items: string[] };

const copy: { en: Copy } & Partial<Record<"zh-TW" | "zh-CN" | "ja", Copy>> = {
  en: {
    eyebrow: "The everyday edit",
    heading: "Twelve things worth keeping",
    hint: "Drag to spin, tap a piece to bring it forward",
    label: "The everyday edit, 12 pieces",
    picked: "Selected",
    items: ["Stoneware mug", "Canvas tote", "Desk lamp", "Steel bottle", "Bud vase", "Soy candle", "Leather journal", "Sencha tin", "Canvas rucksack", "Field watch", "Leather wallet", "Wool scarf"],
  },
  "zh-TW": {
    eyebrow: "日常選物",
    heading: "十二件值得留著用的東西",
    hint: "拖曳旋轉，點一件拉到前面",
    label: "日常選物，共 12 件",
    picked: "目前選擇",
    items: ["石陶馬克杯", "帆布托特包", "桌燈", "不鏽鋼水壺", "小花器", "大豆蠟燭", "皮革手帳", "煎茶罐", "帆布後背包", "野戰錶", "皮革短夾", "羊毛圍巾"],
  },
  "zh-CN": {
    eyebrow: "日常选物",
    heading: "十二件值得留着用的东西",
    hint: "拖动旋转，点一件拉到前面",
    label: "日常选物，共 12 件",
    picked: "当前选择",
    items: ["石陶马克杯", "帆布托特包", "台灯", "不锈钢水壶", "小花器", "大豆蜡烛", "皮革手账", "煎茶罐", "帆布双肩包", "野战表", "皮革短夹", "羊毛围巾"],
  },
  ja: {
    eyebrow: "日常のセレクト",
    heading: "長く使いたい 12 のもの",
    hint: "ドラッグで回転、タップで手前に",
    label: "日常のセレクト 全 12 点",
    picked: "選択中",
    items: ["陶器のマグ", "キャンバストート", "デスクランプ", "ステンレスボトル", "一輪挿し", "ソイキャンドル", "革の手帳", "煎茶の缶", "キャンバスリュック", "フィールドウォッチ", "革の財布", "ウールのマフラー"],
  },
};

export default function OrbitGalleryDemo() {
  const t = useDemoText(copy);
  const images: OrbitImage[] = t.items.map((alt, i) => ({ src: photo(i), alt }));
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <section className="w-full max-w-3xl px-4 py-6 text-center">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{t.heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      <OrbitGallery images={images} label={t.label} onSelect={(_, index) => setPicked(index)} className="mt-4" />
      {/* The selected item lands below the sphere: same slot, swapped content, no layout shift */}
      <div className="mt-2 flex h-11 items-center justify-center">
        {picked !== null && (
          <div className="inline-flex items-center gap-2.5 rounded-lg bg-card py-1 pr-3 pl-1 text-sm shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
            <img src={photo(picked)} alt="" className="size-8 rounded-md object-cover" />
            <span className="text-muted-foreground">{t.picked}</span>
            <span className="font-medium text-foreground">{t.items[picked]}</span>
          </div>
        )}
      </div>
    </section>
  );
}
