"use client";

import { useDemoText } from "@/lib/demo-locale";

import { InfiniteCanvas, type InfiniteCanvasItem } from "./infinite-canvas";

// 與 demo 相同的靜物佔位插畫（SVG data URI）
const tones = [
  ["#e9e2d4", "#6b5a45"],
  ["#dfe6e1", "#3f5b4f"],
  ["#e6dfe8", "#5b4a63"],
  ["#e3e6ec", "#3d4a5f"],
  ["#efe3d6", "#8a4b2a"],
  ["#e2e2dc", "#4a4a40"],
];

const shapes = [
  "<path d='M70 110 h100 l-8 90 h-84z' /><path d='M95 110 q25 -50 50 0' fill='none' stroke-width='6'/>",
  "<path d='M105 80 h30 v20 q30 25 20 70 q-5 30 -35 30 q-30 0 -35 -30 q-10 -45 20 -70z'/>",
  "<path d='M80 100 h70 v80 q0 15 -15 15 h-40 q-15 0 -15 -15z'/><path d='M150 120 q30 0 30 25 q0 25 -30 25' fill='none' stroke-width='8'/>",
  "<path d='M90 90 l60 0 l20 50 h-100z'/><rect x='116' y='140' width='8' height='50'/><rect x='92' y='190' width='56' height='10' rx='3'/>",
  "<ellipse cx='120' cy='170' rx='70' ry='16'/><path d='M80 170 q0 -70 40 -70 q40 0 40 70z'/>",
  "<rect x='80' y='90' width='80' height='105' rx='4'/><rect x='88' y='98' width='6' height='89' fill='#fff' opacity='.5'/>",
];

function plate(i: number) {
  const [bg, ink] = tones[i % tones.length];
  const shape = shapes[i % shapes.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 260'><rect width='240' height='260' fill='${bg}'/><ellipse cx='120' cy='208' rx='80' ry='10' fill='${ink}' opacity='.12'/><g fill='${ink}' stroke='${ink}'>${shape}</g><text x='16' y='28' font-family='monospace' font-size='12' fill='${ink}' opacity='.6'>No.${String(i + 1).padStart(2, "0")}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const copy = {
  en: { label: "Autumn lookbook", names: ["Linen tote", "Stoneware vase", "Morning mug", "Brass desk lamp", "Wool bucket hat", "Field notebook", "Canvas market bag", "Bud vase", "Espresso cup"] },
  "zh-TW": { label: "秋季選品", names: ["亞麻托特包", "粗陶花瓶", "早晨馬克杯", "黃銅檯燈", "羊毛漁夫帽", "野外筆記本", "帆布市集包", "單枝花器", "濃縮咖啡杯"] },
  "zh-CN": { label: "秋季选品", names: ["亚麻托特包", "粗陶花瓶", "早晨马克杯", "黄铜台灯", "羊毛渔夫帽", "野外笔记本", "帆布市集包", "单枝花器", "浓缩咖啡杯"] },
  ja: { label: "秋のルックブック", names: ["リネントート", "陶器のフラワーベース", "モーニングマグ", "真鍮のデスクランプ", "ウールのバケットハット", "フィールドノート", "キャンバスのマルシェバッグ", "一輪挿し", "エスプレッソカップ"] },
};

/** 型錄卡片：一面無限延伸的選品牆，緩慢漂移，可往任何方向拖曳，點一件放大。 */
export default function InfiniteCanvasCard() {
  const t = useDemoText(copy);
  const items: InfiniteCanvasItem[] = t.names.map((name, i) => ({ id: String(i), src: plate(i), alt: name, label: name, caption: name }));
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
