"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { InfiniteCanvas, type InfiniteCanvasItem } from "./infinite-canvas";

// 示範用的佔位插畫：每張是一件靜物的 SVG data URI，不讀外部圖片
const tones = [
  ["#e9e2d4", "#6b5a45"],
  ["#dfe6e1", "#3f5b4f"],
  ["#e6dfe8", "#5b4a63"],
  ["#e3e6ec", "#3d4a5f"],
  ["#efe3d6", "#8a4b2a"],
  ["#e2e2dc", "#4a4a40"],
];

const shapes = [
  // 托特包
  "<path d='M70 110 h100 l-8 90 h-84z' /><path d='M95 110 q25 -50 50 0' fill='none' stroke-width='6'/>",
  // 花瓶
  "<path d='M105 80 h30 v20 q30 25 20 70 q-5 30 -35 30 q-30 0 -35 -30 q-10 -45 20 -70z'/>",
  // 馬克杯
  "<path d='M80 100 h70 v80 q0 15 -15 15 h-40 q-15 0 -15 -15z'/><path d='M150 120 q30 0 30 25 q0 25 -30 25' fill='none' stroke-width='8'/>",
  // 檯燈
  "<path d='M90 90 l60 0 l20 50 h-100z'/><rect x='116' y='140' width='8' height='50'/><rect x='92' y='190' width='56' height='10' rx='3'/>",
  // 帽子
  "<ellipse cx='120' cy='170' rx='70' ry='16'/><path d='M80 170 q0 -70 40 -70 q40 0 40 70z'/>",
  // 書本
  "<rect x='80' y='90' width='80' height='105' rx='4'/><rect x='88' y='98' width='6' height='89' fill='#fff' opacity='.5'/>",
];

function plate(i: number) {
  const [bg, ink] = tones[i % tones.length];
  const shape = shapes[i % shapes.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 260'><rect width='240' height='260' fill='${bg}'/><ellipse cx='120' cy='208' rx='80' ry='10' fill='${ink}' opacity='.12'/><g fill='${ink}' stroke='${ink}'>${shape}</g><text x='16' y='28' font-family='monospace' font-size='12' fill='${ink}' opacity='.6'>No.${String(i + 1).padStart(2, "0")}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const copy = {
  en: {
    label: "Autumn lookbook",
    title: "Autumn lookbook",
    hint: "Drag around the board. Tap a piece to see it.",
    selected: "Viewing",
    none: "Nothing selected yet",
    names: ["Linen tote", "Stoneware vase", "Morning mug", "Brass desk lamp", "Wool bucket hat", "Field notebook", "Canvas market bag", "Bud vase", "Espresso cup", "Reading lamp", "Felt fedora", "Pocket journal"],
  },
  "zh-TW": {
    label: "秋季選品",
    title: "秋季選品",
    hint: "拖曳瀏覽整面選品，點一件看細節。",
    selected: "正在看",
    none: "還沒選擇",
    names: ["亞麻托特包", "粗陶花瓶", "早晨馬克杯", "黃銅檯燈", "羊毛漁夫帽", "野外筆記本", "帆布市集包", "單枝花器", "濃縮咖啡杯", "閱讀燈", "毛氈紳士帽", "口袋手帳"],
  },
  "zh-CN": {
    label: "秋季选品",
    title: "秋季选品",
    hint: "拖动浏览整面选品，点一件看细节。",
    selected: "正在看",
    none: "还没选择",
    names: ["亚麻托特包", "粗陶花瓶", "早晨马克杯", "黄铜台灯", "羊毛渔夫帽", "野外笔记本", "帆布市集包", "单枝花器", "浓缩咖啡杯", "阅读灯", "毛毡绅士帽", "口袋手账"],
  },
  ja: {
    label: "秋のルックブック",
    title: "秋のルックブック",
    hint: "ボードをドラッグして眺め、気になるものをタップ。",
    selected: "表示中",
    none: "まだ選んでいません",
    names: ["リネントート", "陶器のフラワーベース", "モーニングマグ", "真鍮のデスクランプ", "ウールのバケットハット", "フィールドノート", "キャンバスのマルシェバッグ", "一輪挿し", "エスプレッソカップ", "読書灯", "フェルトハット", "ポケット手帳"],
  },
};

export default function InfiniteCanvasDemo() {
  const t = useDemoText(copy);
  const [picked, setPicked] = useState<number | null>(null);
  const items: InfiniteCanvasItem[] = t.names.map((name, i) => ({
    id: String(i),
    src: plate(i),
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
