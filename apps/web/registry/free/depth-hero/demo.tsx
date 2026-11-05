"use client";

import { useDemoText } from "@/lib/demo-locale";

import { DepthHero } from "./depth-hero";

// 示範用的商品圖：透明底的保溫瓶 SVG data URI，不讀外部圖片
const bottle = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 520'>
<ellipse cx='110' cy='506' rx='78' ry='10' fill='#000' opacity='.18'/>
<rect x='70' y='18' width='80' height='54' rx='12' fill='#2b2a27'/>
<rect x='78' y='26' width='10' height='38' rx='5' fill='#fff' opacity='.18'/>
<rect x='62' y='68' width='96' height='22' rx='6' fill='#3a3934'/>
<path d='M58 98 q0 -10 10 -10 h84 q10 0 10 10 v386 q0 18 -18 18 h-68 q-18 0 -18 -18z' fill='#d9d2c3'/>
<path d='M58 98 q0 -10 10 -10 h16 v414 h-8 q-18 0 -18 -18z' fill='#fff' opacity='.35'/>
<path d='M136 88 h16 q10 0 10 10 v386 q0 18 -18 18 h-8z' fill='#000' opacity='.12'/>
<rect x='58' y='230' width='104' height='120' fill='#2b2a27'/>
<text x='110' y='282' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-weight='700' font-size='22' fill='#d9d2c3' letter-spacing='3'>STILL</text>
<text x='110' y='308' text-anchor='middle' font-family='monospace' font-size='11' fill='#d9d2c3' opacity='.7'>750 ML</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

const copy = {
  en: {
    headline: "STILL",
    eyebrow: "New · Ships Nov 11",
    name: "Still Bottle 750",
    body: "Keeps water cold for 24 hours and fits a bike cage. Double steel walls, no plastic inside.",
    price: "$38",
    cta: "Pre-order",
    secondary: "See colors",
    alt: "Still Bottle 750 in sand",
  },
  "zh-TW": {
    headline: "靜水",
    eyebrow: "新品 · 11/11 出貨",
    name: "靜水保溫瓶 750",
    body: "冰水保冷 24 小時，放得進單車水壺架。雙層不鏽鋼，內部沒有塑膠。",
    price: "NT$1,180",
    cta: "立即預購",
    secondary: "看顏色",
    alt: "砂色靜水保溫瓶 750",
  },
  "zh-CN": {
    headline: "静水",
    eyebrow: "新品 · 11/11 发货",
    name: "静水保温瓶 750",
    body: "冰水保冷 24 小时，放得进自行车水壶架。双层不锈钢，内部没有塑料。",
    price: "¥268",
    cta: "立即预订",
    secondary: "看颜色",
    alt: "砂色静水保温瓶 750",
  },
  ja: {
    headline: "静水",
    eyebrow: "新作 · 11/11 発送",
    name: "スティルボトル 750",
    body: "冷たさを 24 時間キープ、自転車のボトルケージにも収まります。二重ステンレスで内側にプラスチックなし。",
    price: "¥5,280",
    cta: "予約する",
    secondary: "カラーを見る",
    alt: "サンドカラーのスティルボトル 750",
  },
};

export default function DepthHeroDemo() {
  const t = useDemoText(copy);

  return (
    <div className="w-full max-w-5xl p-4">
      <DepthHero
        className="min-h-[560px] rounded-xl border border-border sm:min-h-[620px]"
        headline={t.headline}
        headlineClassName="text-foreground/90 -translate-y-10"
        background={
          <div className="h-full w-full bg-muted">
            <div className="absolute left-1/2 top-[42%] aspect-square w-[min(70vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70" />
          </div>
        }
        subject={
          <img src={bottle} alt={t.alt} draggable={false} className="mb-6 h-[70%] max-h-[480px] w-auto" />
        }
      >
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs rounded-lg bg-background/85 p-4 sm:bg-transparent sm:p-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
            <h2 className="mt-1 text-xl font-semibold">{t.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{t.price}</span>
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
            >
              {t.cta}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-medium"
            >
              {t.secondary}
            </button>
          </div>
        </div>
      </DepthHero>
    </div>
  );
}
