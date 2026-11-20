"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { InfiniteCanvas, type InfiniteCanvasItem } from "./infinite-canvas";

// 示範圖：同一組灰底棚拍商品照，放在 public/demo/products/
const photos = ["tote", "vase", "mug", "lamp", "cap", "notebook", "candle", "tea", "wallet", "scarf", "gloves", "watch"];
const photo = (i: number) => `/demo/products/${photos[i % photos.length]}.webp`;

const copy = {
  en: {
    label: "The everyday edit",
    title: "The everyday edit",
    hint: "Drag around the board. Tap a piece to see it.",
    selected: "Viewing",
    none: "Nothing selected yet",
    names: ["Canvas tote", "Bud vase", "Stoneware mug", "Desk lamp", "Wool flat cap", "Leather journal", "Soy candle", "Sencha tin", "Leather wallet", "Oat wool scarf", "Leather gloves", "Field watch"],
  },
  "zh-TW": {
    label: "日常選物",
    title: "日常選物",
    hint: "拖曳瀏覽整面選品，點一件看細節。",
    selected: "正在看",
    none: "還沒選擇",
    names: ["帆布托特包", "小花器", "石陶馬克杯", "桌燈", "羊毛報童帽", "皮革手帳", "大豆蠟燭", "煎茶罐", "皮革短夾", "燕麥色圍巾", "皮手套", "野戰錶"],
  },
  "zh-CN": {
    label: "日常选物",
    title: "日常选物",
    hint: "拖动浏览整面选品，点一件看细节。",
    selected: "正在看",
    none: "还没选择",
    names: ["帆布托特包", "小花器", "石陶马克杯", "台灯", "羊毛报童帽", "皮革手账", "大豆蜡烛", "煎茶罐", "皮革短夹", "燕麦色围巾", "皮手套", "野战表"],
  },
  ja: {
    label: "日常のセレクト",
    title: "日常のセレクト",
    hint: "ボードをドラッグして眺め、気になるものをタップ。",
    selected: "表示中",
    none: "まだ選んでいません",
    names: ["キャンバストート", "一輪挿し", "陶器のマグ", "デスクランプ", "ウールのハンチング", "革の手帳", "ソイキャンドル", "煎茶の缶", "革の財布", "オートミールのマフラー", "革の手袋", "フィールドウォッチ"],
  },
};

export default function InfiniteCanvasDemo() {
  const t = useDemoText(copy);
  const [picked, setPicked] = useState<number | null>(null);
  const items: InfiniteCanvasItem[] = t.names.map((name, i) => ({
    id: String(i),
    src: photo(i),
    alt: name,
    label: name,
    caption: name,
  }));

  return (
    <div className="w-full max-w-5xl space-y-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{t.title}</h3>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>
      <InfiniteCanvas
        items={items}
        label={t.label}
        cellWidth={200}
        cellHeight={250}
        gap={20}
        onSelect={(_, i) => setPicked(i)}
        className="h-[420px] border border-border bg-muted/40 sm:h-[520px]"
      />
      <p className="h-5 truncate text-sm leading-5 text-muted-foreground" aria-live="polite">
        {picked === null ? t.none : `${t.selected}: ${t.names[picked]}`}
      </p>
    </div>
  );
}
