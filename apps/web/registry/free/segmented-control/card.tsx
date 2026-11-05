"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SegmentedControl } from "./segmented-control";

type Color = "oat" | "clay" | "ink";
type Size = "xs" | "s" | "m" | "l" | "xl";

const colors: { value: Color; hex: string }[] = [
  { value: "oat", hex: "#d8ccb2" },
  { value: "clay", hex: "#a5634a" },
  { value: "ink", hex: "#2b2926" },
];

const copy = {
  en: {
    colors: { oat: "Oat", clay: "Clay", ink: "Ink" },
    color: "Color",
    size: "Size",
    soldOut: (s: string) => `${s}, sold out`,
    left: (n: number) => `Only ${n} left in this size`,
    inStock: "In stock, ships in 1 to 2 days",
  },
  "zh-TW": {
    colors: { oat: "燕麥", clay: "陶土", ink: "墨黑" },
    color: "顏色",
    size: "尺寸",
    soldOut: (s: string) => `${s}，已售完`,
    left: (n: number) => `此尺寸僅剩 ${n} 件`,
    inStock: "有現貨，1 到 2 天內出貨",
  },
  "zh-CN": {
    colors: { oat: "燕麦", clay: "陶土", ink: "墨黑" },
    color: "颜色",
    size: "尺码",
    soldOut: (s: string) => `${s}，已售罄`,
    left: (n: number) => `该尺码仅剩 ${n} 件`,
    inStock: "有现货，1 到 2 天内发货",
  },
  ja: {
    colors: { oat: "オート", clay: "クレイ", ink: "インク" },
    color: "カラー",
    size: "サイズ",
    soldOut: (s: string) => `${s}、売り切れ`,
    left: (n: number) => `このサイズは残り${n}点`,
    inStock: "在庫あり、1〜2日で発送",
  },
};

const stock: Record<Size, number> = { xs: 6, s: 14, m: 2, l: 9, xl: 0 };

function Swatch({ hex }: { hex: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill={hex} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}

/** 型錄卡片：顏色與尺寸兩組選項，選取外框在選項間滑動，售完的尺寸劃線停用。 */
export default function SegmentedControlCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [color, setColor] = useState<Color>("clay");
  const [size, setSize] = useState<Size>("m");
  const left = stock[size];

  return (
    <div className="mx-auto flex w-72 flex-col gap-4">
      <SegmentedControl<Color>
        locale={locale}
        aria-label={t.color}
        size="sm"
        value={color}
        onValueChange={setColor}
        options={colors.map((c) => ({ value: c.value, label: t.colors[c.value], icon: <Swatch hex={c.hex} /> }))}
      />
      <div className="space-y-2">
        <SegmentedControl<Size>
          locale={locale}
          aria-label={t.size}
          size="sm"
          value={size}
          onValueChange={setSize}
          options={(Object.keys(stock) as Size[]).map((s) => ({
            value: s,
            label: s.toUpperCase(),
            ariaLabel: stock[s] === 0 ? t.soldOut(s.toUpperCase()) : undefined,
            disabled: stock[s] === 0,
          }))}
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          {left <= 3 ? <span className="text-[#c8361d] dark:text-[#ec6a4f]">{t.left(left)}</span> : t.inStock}
        </p>
      </div>
    </div>
  );
}
