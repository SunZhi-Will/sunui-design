"use client";

import { useDemoText } from "@/lib/demo-locale";

import { RasterImage, type RasterMode } from "./raster-image";

// 示範用的靜物插圖：SVG data URI，有明暗層次，給點陣化取樣用
const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>${body}</svg>`)}`;

const bottle = svg(`<defs>
<radialGradient id='bg' cx='.5' cy='.35' r='.8'><stop offset='0' stop-color='#fafafa'/><stop offset='1' stop-color='#a3a3a3'/></radialGradient>
<linearGradient id='glass' x1='0' x2='1'><stop offset='0' stop-color='#171717'/><stop offset='.35' stop-color='#737373'/><stop offset='.55' stop-color='#d4d4d4'/><stop offset='1' stop-color='#171717'/></linearGradient>
<linearGradient id='cap' x1='0' x2='1'><stop offset='0' stop-color='#262626'/><stop offset='.5' stop-color='#a3a3a3'/><stop offset='1' stop-color='#262626'/></linearGradient>
</defs>
<rect width='800' height='600' fill='url(#bg)'/>
<ellipse cx='400' cy='520' rx='170' ry='26' fill='#404040' opacity='.55'/>
<rect x='290' y='230' width='220' height='290' rx='26' fill='url(#glass)'/>
<rect x='330' y='330' width='140' height='90' rx='4' fill='#f5f5f5'/>
<rect x='350' y='352' width='100' height='10' fill='#525252'/><rect x='365' y='378' width='70' height='8' fill='#a3a3a3'/>
<rect x='360' y='170' width='80' height='64' rx='6' fill='url(#cap)'/>
<rect x='300' y='240' width='26' height='260' rx='13' fill='#fff' opacity='.35'/>`);

const stillLife = svg(`<defs>
<linearGradient id='wall' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e5e5e5'/><stop offset='1' stop-color='#d4d4d4'/></linearGradient>
<radialGradient id='ball' cx='.35' cy='.3' r='.75'><stop offset='0' stop-color='#fafafa'/><stop offset='.6' stop-color='#737373'/><stop offset='1' stop-color='#171717'/></radialGradient>
<linearGradient id='vase' x1='0' x2='1'><stop offset='0' stop-color='#262626'/><stop offset='.4' stop-color='#a3a3a3'/><stop offset='1' stop-color='#171717'/></linearGradient>
</defs>
<rect width='800' height='600' fill='url(#wall)'/>
<rect y='430' width='800' height='170' fill='#525252'/>
<ellipse cx='300' cy='470' rx='130' ry='20' fill='#171717' opacity='.5'/>
<path d='M240 470 C200 380 210 300 260 260 L250 180 L350 180 L340 260 C390 300 400 380 360 470 Z' fill='url(#vase)'/>
<ellipse cx='560' cy='470' rx='110' ry='18' fill='#171717' opacity='.5'/>
<circle cx='560' cy='370' r='100' fill='url(#ball)'/>`);

const ridge = svg(`<defs>
<linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fafafa'/><stop offset='1' stop-color='#a3a3a3'/></linearGradient>
</defs>
<rect width='800' height='600' fill='url(#sky)'/>
<circle cx='560' cy='190' r='70' fill='#fff'/>
<path d='M0 380 L160 240 L300 360 L450 210 L800 400 V600 H0Z' fill='#737373'/>
<path d='M0 470 L210 340 L400 450 L600 320 L800 450 V600 H0Z' fill='#404040'/>
<path d='M0 560 L250 470 L520 560 L800 500 V600 H0Z' fill='#171717'/>`);

const copy = {
  en: {
    eyebrow: "Studio drop",
    title: "Autumn objects, printed five ways",
    lead: "Point at a print to push the marks around.",
    items: [
      { mode: "halftone", caption: "Eau de parfum, 50 ml", alt: "Glass perfume bottle with a metal cap on a pale backdrop" },
      { mode: "ascii", caption: "Stoneware vase and sphere", alt: "Stoneware vase beside a polished sphere on a table" },
      { mode: "dots", caption: "Eau de parfum, night edition", alt: "Perfume bottle printed as light dots on a dark ground" },
      { mode: "dither", caption: "Table still life", alt: "Vase and sphere rendered in one-bit dither" },
      { mode: "lines", caption: "Ridge line poster, A2", alt: "Layered mountain ridges under a pale sun" },
    ],
  },
  "zh-TW": {
    eyebrow: "工作室新品",
    title: "秋季器物，五種印法",
    lead: "游標指向圖片，網點會被推開。",
    items: [
      { mode: "halftone", caption: "淡香精 50 ml", alt: "淺色背景前的玻璃香水瓶，金屬瓶蓋" },
      { mode: "ascii", caption: "炻器花瓶與球體", alt: "桌上的炻器花瓶與一顆亮面球體" },
      { mode: "dots", caption: "淡香精 夜間限定", alt: "深色底上以亮點印出的香水瓶" },
      { mode: "dither", caption: "桌上靜物", alt: "以單色抖動印出的花瓶與球體" },
      { mode: "lines", caption: "山稜線海報 A2", alt: "淡色太陽下層層疊疊的山稜" },
    ],
  },
  "zh-CN": {
    eyebrow: "工作室新品",
    title: "秋季器物，五种印法",
    lead: "光标指向图片，网点会被推开。",
    items: [
      { mode: "halftone", caption: "淡香精 50 ml", alt: "浅色背景前的玻璃香水瓶，金属瓶盖" },
      { mode: "ascii", caption: "炻器花瓶与球体", alt: "桌上的炻器花瓶与一颗亮面球体" },
      { mode: "dots", caption: "淡香精 夜间限定", alt: "深色底上以亮点印出的香水瓶" },
      { mode: "dither", caption: "桌上静物", alt: "以单色抖动印出的花瓶与球体" },
      { mode: "lines", caption: "山棱线海报 A2", alt: "淡色太阳下层层叠叠的山棱" },
    ],
  },
  ja: {
    eyebrow: "スタジオ新作",
    title: "秋のオブジェを、5 つの刷り方で",
    lead: "ポインターを向けると、網点が押しのけられます。",
    items: [
      { mode: "halftone", caption: "オードパルファム 50 ml", alt: "淡い背景の前に置かれた金属キャップのガラス香水瓶" },
      { mode: "ascii", caption: "炻器の花瓶と球", alt: "テーブルの上の炻器の花瓶と磨かれた球" },
      { mode: "dots", caption: "オードパルファム 夜の限定版", alt: "暗い地に明るい点で刷った香水瓶" },
      { mode: "dither", caption: "テーブルの静物", alt: "1 ビットのディザで描いた花瓶と球" },
      { mode: "lines", caption: "稜線ポスター A2", alt: "淡い太陽の下に重なる山の稜線" },
    ],
  },
};

const images: Record<string, string> = { halftone: bottle, ascii: stillLife, dots: bottle, dither: stillLife, lines: ridge };

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
