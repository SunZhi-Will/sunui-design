"use client";

import { useDemoText } from "@/lib/demo-locale";

import { DepthHero } from "./depth-hero";

// 與 demo 相同的保溫瓶 SVG（透明底），不讀外部圖片
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
  en: { headline: "STILL", name: "Still Bottle 750", price: "$38", cta: "Pre-order", alt: "Still Bottle 750 in sand" },
  "zh-TW": { headline: "靜水", name: "靜水保溫瓶 750", price: "NT$1,180", cta: "立即預購", alt: "砂色靜水保溫瓶 750" },
  "zh-CN": { headline: "静水", name: "静水保温瓶 750", price: "¥268", cta: "立即预订", alt: "砂色静水保温瓶 750" },
  ja: { headline: "静水", name: "スティルボトル 750", price: "¥5,280", cta: "予約する", alt: "サンドカラーのスティルボトル 750" },
};

/** 型錄卡片：大字標題壓在商品後面，滑鼠移動時背景、標題、商品三層各自位移出景深。 */
export default function DepthHeroCard() {
  const t = useDemoText(copy);
  return (
    <div className="w-[340px]">
      <DepthHero
        className="h-[260px] min-h-0 rounded-xl border border-border"
        headline={t.headline}
        headlineClassName="text-[104px] text-foreground/90 -translate-y-6"
        background={
          <div className="h-full w-full bg-muted">
            <div className="absolute left-1/2 top-[42%] aspect-square w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/70" />
          </div>
        }
        subject={<img src={bottle} alt={t.alt} draggable={false} className="mb-3 h-[76%] w-auto" />}
      >
        {/* 卡片很矮：抵掉一部分元件的 p-6 內距，文字貼近底邊 */}
        <div className="-m-2 flex w-full items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-sm tabular-nums text-muted-foreground">{t.price}</p>
          </div>
          <button type="button" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-transform active:scale-[0.98]">
            {t.cta}
          </button>
        </div>
      </DepthHero>
    </div>
  );
}
