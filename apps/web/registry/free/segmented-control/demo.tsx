"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { SegmentedControl } from "./segmented-control";

type Color = "oat" | "clay" | "ink";
type Size = "xs" | "s" | "m" | "l" | "xl";

const colors: { value: Color; hex: string }[] = [
  { value: "oat", hex: "#d8ccb2" },
  { value: "clay", hex: "#a5634a" },
  { value: "ink", hex: "#2b2926" },
];

const stock: Record<Size, number> = { xs: 6, s: 14, m: 2, l: 9, xl: 0 };

const copy = {
  en: {
    colors: { oat: "Oat", clay: "Clay", ink: "Ink" },
    color: "Color",
    size: "Size",
    guide: "Size guide",
    soldOut: (s: string) => `${s}, sold out`,
    left: (n: number) => `Only ${n} left in this size`,
    inStock: "In stock, ships in 1 to 2 days",
    add: "Add to bag",
  },
  "zh-TW": {
    colors: { oat: "燕麥", clay: "陶土", ink: "墨黑" },
    color: "顏色",
    size: "尺寸",
    guide: "尺寸指南",
    soldOut: (s: string) => `${s}，已售完`,
    left: (n: number) => `此尺寸僅剩 ${n} 件`,
    inStock: "有現貨，1 到 2 天內出貨",
    add: "加入購物袋",
  },
  "zh-CN": {
    colors: { oat: "燕麦", clay: "陶土", ink: "墨黑" },
    color: "颜色",
    size: "尺码",
    guide: "尺码指南",
    soldOut: (s: string) => `${s}，已售罄`,
    left: (n: number) => `该尺码仅剩 ${n} 件`,
    inStock: "有现货，1 到 2 天内发货",
    add: "加入购物袋",
  },
  ja: {
    colors: { oat: "オート", clay: "クレイ", ink: "インク" },
    color: "カラー",
    size: "サイズ",
    guide: "サイズガイド",
    soldOut: (s: string) => `${s}、売り切れ`,
    left: (n: number) => `このサイズは残り${n}点`,
    inStock: "在庫あり、1〜2日で発送",
    add: "バッグに追加",
  },
};

function Swatch({ hex }: { hex: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill={hex} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}

export default function SegmentedControlDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [color, setColor] = useState<Color>("clay");
  const [size, setSize] = useState<Size>("m");
  const left = stock[size];

  return (
    <div className="grid w-full max-w-2xl gap-6 rounded-md border border-border bg-card p-4 text-card-foreground sm:grid-cols-[15rem_1fr] sm:p-5">
      <ProductArt kind="jacket" tone="kraft" className="aspect-[3/2] rounded-md sm:aspect-square" />

      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{useProductNames().jacket}</h2>
          <p className="mt-0.5 text-lg tabular-nums">$128.00</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">
            {t.color} <span className="text-muted-foreground">{t.colors[color]}</span>
          </p>
          <SegmentedControl<Color>
            locale={locale}
            aria-label={t.color}
            value={color}
            onValueChange={setColor}
            options={colors.map((c) => ({ value: c.value, label: t.colors[c.value], icon: <Swatch hex={c.hex} /> }))}
          />
        </div>

        <div className="space-y-2">
          <p className="flex items-baseline justify-between gap-3 text-sm">
            {t.size}
            <span className="text-xs text-muted-foreground underline underline-offset-4">{t.guide}</span>
          </p>
          <SegmentedControl<Size>
            locale={locale}
            aria-label={t.size}
            value={size}
            onValueChange={setSize}
            options={(Object.keys(stock) as Size[]).map((s) => ({
              value: s,
              label: s.toUpperCase(),
              ariaLabel: stock[s] === 0 ? t.soldOut(s.toUpperCase()) : undefined,
              disabled: stock[s] === 0,
            }))}
          />
          <p className="text-xs text-muted-foreground">
            {left <= 3 ? <span className="text-[#c8361d] dark:text-[#ec6a4f]">{t.left(left)}</span> : t.inStock}
          </p>
        </div>

        <button
          type="button"
          className="mt-auto h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t.add}
        </button>
      </div>
    </div>
  );
}
