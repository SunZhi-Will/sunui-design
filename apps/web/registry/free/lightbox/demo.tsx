"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Lightbox } from "./lightbox";

// 示範照片（AI 生成），放在 public/blocks/lightbox；縮圖另存 480 px 的 -thumb 版
const photos = ["front", "rib", "stack", "back", "cuff", "label"];
const sources = photos.map((name) => `/blocks/lightbox/${name}.webp`);
const thumbs = photos.map((name) => `/blocks/lightbox/${name}-thumb.webp`);

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
        images={sources.map((src, i) => ({ id: String(i), src, thumbSrc: thumbs[i], alt: t.alts[i], caption: t.captions[i] }))}
      />
    </div>
  );
}
