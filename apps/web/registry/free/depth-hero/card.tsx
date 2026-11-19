"use client";

import { useDemoText } from "@/lib/demo-locale";

import { DepthHero } from "./depth-hero";

// Same cut-out thermos photo as the demo (transparent WebP)
const bottle = "/blocks/depth-hero/bottle.webp";

const copy = {
  en: { headline: "STILL", name: "Still Bottle 750", price: "$38", cta: "Pre-order", alt: "Still Bottle 750 in sand" },
  "zh-TW": { headline: "靜水", name: "靜水保溫瓶 750", price: "NT$1,180", cta: "立即預購", alt: "砂色靜水保溫瓶 750" },
  "zh-CN": { headline: "静水", name: "静水保温瓶 750", price: "¥268", cta: "立即预订", alt: "砂色静水保温瓶 750" },
  ja: { headline: "静水", name: "スティルボトル 750", price: "¥5,280", cta: "予約する", alt: "サンドカラーのスティルボトル 750" },
};

/** Catalog card: a big headline sits behind the product, and as the mouse moves the background, headline and product shift separately to give depth. */
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
        {/* The card is very short: offset part of the component's p-6 padding so the text sits close to the bottom edge */}
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
