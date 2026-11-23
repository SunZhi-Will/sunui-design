"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { AnimatedNumber } from "./animated-number";

const finishes = [
  { id: "steel", extra: 0 },
  { id: "brass", extra: 40 },
] as const;

const copy = {
  en: {
    blurb: "Hand-wound, sapphire crystal, 100 m water resistant.",
    finish: "Finish",
    finishes: { steel: "Brushed steel case", brass: "Brass case" },
    addCase: "Add a spare leather strap",
    total: "Total",
    dec: "Decrease quantity",
    inc: "Increase quantity",
  },
  "zh-TW": {
    blurb: "手上鍊機芯，藍寶石鏡面，100 米防水。",
    finish: "外觀",
    finishes: { steel: "霧面鋼殼", brass: "黃銅錶殼" },
    addCase: "加購一條備用皮錶帶",
    total: "總計",
    dec: "減少數量",
    inc: "增加數量",
  },
  "zh-CN": {
    blurb: "手动上链机芯，蓝宝石镜面，100 米防水。",
    finish: "外观",
    finishes: { steel: "磨砂钢壳", brass: "黄铜表壳" },
    addCase: "加购一条备用皮表带",
    total: "合计",
    dec: "减少数量",
    inc: "增加数量",
  },
  ja: {
    blurb: "手巻き、サファイアクリスタル、100 m 防水。",
    finish: "仕上げ",
    finishes: { steel: "ブラッシュドスチール", brass: "真鍮ケース" },
    addCase: "替えの革ベルトを追加",
    total: "合計",
    dec: "数量を減らす",
    inc: "数量を増やす",
  },
};

export default function AnimatedNumberDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const productNames = useProductNames();
  const [finish, setFinish] = useState<(typeof finishes)[number]>(finishes[0]);
  const [qty, setQty] = useState(1);
  const [withCase, setWithCase] = useState(false);
  const total = (189 + finish.extra + (withCase ? 29 : 0)) * qty;

  return (
    <div className="grid w-full max-w-2xl gap-6 rounded-xl border border-border bg-card p-4 text-card-foreground sm:grid-cols-[14rem_1fr] sm:p-5">
      <ProductArt kind="watch" className="aspect-[3/2] rounded-md sm:aspect-square" />

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{productNames.watch}</h2>
          <p className="text-sm text-muted-foreground">{t.blurb}</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">{t.finish}</legend>
          {finishes.map((f) => (
            <label key={f.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="finish"
                checked={finish.id === f.id}
                onChange={() => setFinish(f)}
                className="size-4 accent-foreground"
              />
              {t.finishes[f.id]}
              {f.extra > 0 && <span className="text-muted-foreground tabular-nums">+${f.extra}</span>}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm">
            <input type="checkbox" checked={withCase} onChange={(e) => setWithCase(e.target.checked)} className="size-4 accent-foreground" />
            {t.addCase} <span className="text-muted-foreground tabular-nums">+$29</span>
          </label>
        </fieldset>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">{t.total}</p>
            <AnimatedNumber locale={locale} value={total} currency="USD" trendArrow announce variant="odometer" className="text-3xl font-semibold tracking-tight" />
          </div>
          <div className="flex h-9 items-center rounded-md border border-border text-sm">
            <button
              type="button"
              aria-label={t.dec}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 8h10" strokeLinecap="round" />
              </svg>
            </button>
            <AnimatedNumber locale={locale} value={qty} className="w-6 justify-center font-medium" />
            <button
              type="button"
              aria-label={t.inc}
              onClick={() => setQty((q) => Math.min(9, q + 1))}
              className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
