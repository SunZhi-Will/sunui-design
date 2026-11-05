"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Lightbox } from "./lightbox";

// 中性色的示意圖（SVG data URI），換成真實商品照即可
function tile(bg: string, fg: string, shape: "crew" | "detail" | "fold" | "flat" | "cuff" | "tag") {
  const shapes = {
    crew: `<path d="M140 90 L110 100 L70 140 L60 330 L100 340 L110 200 L115 400 L285 400 L290 200 L300 340 L340 330 L330 140 L290 100 L260 90 Q200 130 140 90Z" fill="${fg}"/>`,
    detail: `<g stroke="${fg}" stroke-width="10" fill="none">${Array.from({ length: 9 }, (_, i) => `<path d="M${40 + i * 40} 60 V440"/>`).join("")}</g>`,
    fold: `<rect x="90" y="150" width="220" height="70" rx="8" fill="${fg}"/><rect x="90" y="230" width="220" height="70" rx="8" fill="${fg}" opacity=".8"/><rect x="90" y="310" width="220" height="70" rx="8" fill="${fg}" opacity=".6"/>`,
    flat: `<rect x="80" y="100" width="240" height="300" rx="10" fill="${fg}"/><path d="M160 100 Q200 150 240 100" stroke="${bg}" stroke-width="10" fill="none"/>`,
    cuff: `<rect x="120" y="80" width="160" height="260" rx="10" fill="${fg}"/><g stroke="${bg}" stroke-width="6">${Array.from({ length: 6 }, (_, i) => `<path d="M${140 + i * 24} 280 V340"/>`).join("")}</g>`,
    tag: `<rect x="130" y="140" width="140" height="200" rx="8" fill="${fg}"/><circle cx="200" cy="175" r="12" fill="${bg}"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/>${shapes[shape]}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const sources = [
  tile("#e6e6e6", "#8e8e8e", "crew"),
  tile("#dcdcdc", "#a7a7a7", "detail"),
  tile("#eaeaea", "#7d7d7d", "fold"),
  tile("#e1e1e1", "#646464", "flat"),
  tile("#e5e5e5", "#969696", "cuff"),
  tile("#e3e3e3", "#171717", "tag"),
];

const copy = {
  en: {
    name: "Merino crew neck, oat",
    alts: ["Front view", "Rib knit detail", "Folded stack", "Back view laid flat", "Ribbed cuff", "Care label"],
    captions: ["Relaxed fit, model is 178 cm wearing M", "2 × 2 rib at the cuffs and hem", "Three colours, all from undyed wool", "Dropped shoulder seam", "Cuffs stay snug after washing", "Hand wash cold, dry flat"],
    labels: { close: "Close", previous: "Previous image", next: "Next image", open: (alt: string) => `Enlarge: ${alt}` },
  },
  "zh-TW": {
    name: "美麗諾圓領針織衫，燕麥色",
    alts: ["正面", "羅紋針織細節", "折疊堆放", "背面平放", "羅紋袖口", "洗標"],
    captions: ["寬鬆版型，模特兒 178 公分穿 M", "袖口與下襬為 2 × 2 羅紋", "三種顏色，全部是未染色羊毛", "落肩縫線", "洗過之後袖口依然服貼", "冷水手洗，平放晾乾"],
    labels: { close: "關閉", previous: "上一張", next: "下一張", open: (alt: string) => `放大：${alt}` },
  },
  "zh-CN": {
    name: "美丽诺圆领针织衫，燕麦色",
    alts: ["正面", "罗纹针织细节", "叠放", "背面平铺", "罗纹袖口", "洗标"],
    captions: ["宽松版型，模特 178 厘米穿 M", "袖口与下摆为 2 × 2 罗纹", "三种颜色，全部是未染色羊毛", "落肩缝线", "洗过之后袖口依然服帖", "冷水手洗，平铺晾干"],
    labels: { close: "关闭", previous: "上一张", next: "下一张", open: (alt: string) => `放大：${alt}` },
  },
  ja: {
    name: "メリノ クルーネック、オートミール",
    alts: ["正面", "リブ編みのディテール", "たたんだ状態", "背面の平置き", "リブの袖口", "洗濯表示"],
    captions: ["ゆったりシルエット、モデル 178 cm で M 着用", "袖口と裾は 2 × 2 リブ", "3 色すべて未染色のウール", "ドロップショルダー", "洗っても袖口が伸びにくい", "冷水で手洗い、平干し"],
    labels: { close: "閉じる", previous: "前の画像", next: "次の画像", open: (alt: string) => `拡大：${alt}` },
  },
};

export default function LightboxDemo() {
  const t = useDemoText(copy);
  return (
    <div className="relative w-full max-w-xl overflow-hidden rounded-lg border bg-background p-5">
      <p className="mb-4 text-base font-semibold tracking-tight">{t.name}</p>
      <Lightbox
        position="contained"
        labels={t.labels}
        images={sources.map((src, i) => ({ id: String(i), src, alt: t.alts[i], caption: t.captions[i] }))}
      />
    </div>
  );
}
