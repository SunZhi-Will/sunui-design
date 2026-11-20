"use client";

import { useDemoText } from "@/lib/demo-locale";

import { RasterImage, type RasterMode } from "./raster-image";

// 示範圖：棚拍商品與風景照，轉灰階並拉高對比，放在 public/demo/raster/（同源，canvas 才能取樣）
const boots = "/demo/raster/boots.webp";
const lamp = "/demo/raster/lamp.webp";
const ridge = "/demo/raster/peaks.webp";

const copy = {
  en: {
    eyebrow: "Studio drop",
    title: "Autumn objects, printed five ways",
    lead: "Point at a print to push the marks around.",
    items: [
      { mode: "halftone", caption: "Chelsea boots, black leather", alt: "A pair of black leather Chelsea boots seen from above" },
      { mode: "ascii", caption: "Desk lamp, slate", alt: "An angled desk lamp with a cone shade on a pale backdrop" },
      { mode: "dots", caption: "Chelsea boots, night print", alt: "Chelsea boots printed as light dots on a dark ground" },
      { mode: "dither", caption: "Desk lamp, one-bit print", alt: "Desk lamp rendered in one-bit dither" },
      { mode: "lines", caption: "Ridge line poster, A2", alt: "Layered mountain ridges in soft morning light" },
    ],
  },
  "zh-TW": {
    eyebrow: "工作室新品",
    title: "秋季器物，五種印法",
    lead: "游標指向圖片，網點會被推開。",
    items: [
      { mode: "halftone", caption: "切爾西靴 黑色皮革", alt: "俯拍的一雙黑色皮革切爾西靴" },
      { mode: "ascii", caption: "石板灰桌燈", alt: "淺色背景前燈罩呈圓錐形的可調式桌燈" },
      { mode: "dots", caption: "切爾西靴 夜間版", alt: "深色底上以亮點印出的切爾西靴" },
      { mode: "dither", caption: "桌燈 單色版", alt: "以單色抖動印出的桌燈" },
      { mode: "lines", caption: "山稜線海報 A2", alt: "晨光下層層疊疊的山稜" },
    ],
  },
  "zh-CN": {
    eyebrow: "工作室新品",
    title: "秋季器物，五种印法",
    lead: "光标指向图片，网点会被推开。",
    items: [
      { mode: "halftone", caption: "切尔西靴 黑色皮革", alt: "俯拍的一双黑色皮革切尔西靴" },
      { mode: "ascii", caption: "石板灰台灯", alt: "浅色背景前灯罩呈圆锥形的可调式台灯" },
      { mode: "dots", caption: "切尔西靴 夜间版", alt: "深色底上以亮点印出的切尔西靴" },
      { mode: "dither", caption: "台灯 单色版", alt: "以单色抖动印出的台灯" },
      { mode: "lines", caption: "山棱线海报 A2", alt: "晨光下层层叠叠的山棱" },
    ],
  },
  ja: {
    eyebrow: "スタジオ新作",
    title: "秋のオブジェを、5 つの刷り方で",
    lead: "ポインターを向けると、網点が押しのけられます。",
    items: [
      { mode: "halftone", caption: "チェルシーブーツ ブラックレザー", alt: "上から撮った黒い革のチェルシーブーツ" },
      { mode: "ascii", caption: "デスクランプ スレート", alt: "淡い背景の前の円錐シェードのデスクランプ" },
      { mode: "dots", caption: "チェルシーブーツ 夜の版", alt: "暗い地に明るい点で刷ったチェルシーブーツ" },
      { mode: "dither", caption: "デスクランプ 1 ビット版", alt: "1 ビットのディザで描いたデスクランプ" },
      { mode: "lines", caption: "稜線ポスター A2", alt: "朝の光の中に重なる山の稜線" },
    ],
  },
};

const images: Record<string, string> = { halftone: boots, ascii: lamp, dots: boots, dither: lamp, lines: ridge };

/** 單一點陣化樣式的示範格：完整 demo 與首頁型錄（variants.tsx）共用 */
export function RasterTile({ mode, animateIn = false, className }: { mode: RasterMode; animateIn?: boolean; className?: string }) {
  const t = useDemoText(copy);
  const item = t.items.find((x) => x.mode === mode)!;
  const dark = mode === "dots";
  return (
    <figure className={className}>
      <RasterImage
        src={images[mode]}
        alt={item.alt}
        mode={mode}
        cell={mode === "ascii" ? 9 : mode === "dither" ? 4 : 7}
        color={dark ? "#f5f5f5" : undefined}
        background={dark ? "#171717" : undefined}
        invert={dark}
        animateIn={animateIn}
        className="rounded-xl border border-border text-foreground"
      />
      <figcaption className="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span>{item.caption}</span>
        <code className="font-mono text-xs text-muted-foreground">{mode}</code>
      </figcaption>
    </figure>
  );
}

export default function RasterImageDemo() {
  const t = useDemoText(copy);
  return (
    <section className="w-full max-w-5xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{t.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.lead}</p>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.items.map((item, i) => (
          <RasterTile
            key={item.mode}
            mode={item.mode as RasterMode}
            animateIn={i === 0}
            className={i === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
