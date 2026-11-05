"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { OptionChips, VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const teeSwatches = [
  { id: "oat", swatch: "#d9cdb8" },
  { id: "navy", swatch: "#2b3448" },
  { id: "moss", swatch: "#6b7354" },
  { id: "rust", swatch: "#9a4a2e" },
];

const jacketSwatches = [
  { id: "oat", swatch: "#d8ccb2" },
  { id: "clay", swatch: "#a5634a" },
  { id: "ink", swatch: "#2b2926" },
];

type Fit = "regular" | "relaxed";

const copy = {
  en: {
    names: { oat: "Oat", navy: "Navy", moss: "Moss", rust: "Rust", clay: "Clay", ink: "Ink" },
    title: "Heavyweight Cotton Tee",
    fit: "Fit",
    fits: { regular: "Regular", relaxed: "Relaxed" },
    add: "Add to cart",
  },
  "zh-TW": {
    names: { oat: "燕麥", navy: "海軍藍", moss: "苔綠", rust: "鏽紅", clay: "陶土", ink: "墨黑" },
    title: "厚磅純棉 T 恤",
    fit: "版型",
    fits: { regular: "標準", relaxed: "寬鬆" },
    add: "加入購物車",
  },
  "zh-CN": {
    names: { oat: "燕麦", navy: "海军蓝", moss: "苔绿", rust: "锈红", clay: "陶土", ink: "墨黑" },
    title: "重磅纯棉 T 恤",
    fit: "版型",
    fits: { regular: "标准", relaxed: "宽松" },
    add: "加入购物车",
  },
  ja: {
    names: { oat: "オート", navy: "ネイビー", moss: "モス", rust: "ラスト", clay: "クレイ", ink: "インク" },
    title: "ヘビーウェイト コットンT",
    fit: "シルエット",
    fits: { regular: "レギュラー", relaxed: "リラックス" },
    add: "カートに追加",
  },
};

const sizes = ["XS", "S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完
const teeStock: Record<string, number> = {
  "oat:XS": 4, "oat:S": 12, "oat:M": 2, "oat:L": 9, "oat:XL": 0,
  "navy:S": 6, "navy:M": 14, "navy:L": 1, "navy:XL": 5,
  "moss:XS": 3, "moss:M": 8, "moss:L": 7,
};
const jacketStock: Record<string, number> = {
  "oat:XS": 6, "oat:S": 14, "oat:M": 2, "oat:L": 9,
  "clay:S": 5, "clay:M": 11, "clay:L": 4, "clay:XL": 2,
  "ink:M": 7, "ink:L": 3,
};

function AddButton({ disabled, children }: { disabled: boolean; children: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** 兩張商品卡並排：T 恤用紙面尺寸格與售完小章，外套用滑動外框的文字膠囊（另有獨立的版型選項） */
export default function VariantPickerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const product = useProductNames();
  const named = (list: { id: string; swatch: string }[]): VariantColor[] =>
    list.map((c) => ({ ...c, name: t.names[c.id as keyof typeof t.names] }));
  const [tee, setTee] = useState<VariantValue>({ color: "oat", size: "M" });
  const [jacket, setJacket] = useState<VariantValue>({ color: "clay", size: "M" });
  const [fit, setFit] = useState<Fit>("regular");
  const teeSwatch = teeSwatches.find((c) => c.id === tee.color)?.swatch ?? "#d9cdb8";

  return (
    <div className="grid w-full max-w-[52rem] min-w-0 items-start gap-6 md:grid-cols-2">
      <section aria-labelledby="vp-tee" className="min-w-0 space-y-4">
        {/* 中性實物插圖：上衣輪廓跟著所選顏色換色 */}
        <div className="grid aspect-[4/3] place-items-center rounded-md border border-[#e7e0d0] bg-[#faf7f0] dark:border-[#38332b] dark:bg-[#1f1c18]">
          <svg viewBox="0 0 120 120" className="w-2/5" aria-hidden="true">
            <path
              d="M44 18 30 24 12 40l12 16 10-7v53h52V49l10 7 12-16-18-16-14-6c-2 7-8 11-16 11s-14-4-16-11Z"
              fill={teeSwatch}
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 id="vp-tee" className="text-lg font-semibold tracking-tight">
            {t.title}
          </h2>
          <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">$38.00</p>
        </div>
        <VariantPicker locale={locale} colors={named(teeSwatches)} sizes={sizes} stock={teeStock} value={tee} onChange={setTee} />
        <AddButton disabled={!tee.size}>{t.add}</AddButton>
      </section>

      <section aria-labelledby="vp-jacket" className="min-w-0 space-y-4">
        <ProductArt kind="jacket" tone="kraft" className="aspect-[4/3] rounded-md" />
        <div>
          <h2 id="vp-jacket" className="text-lg font-semibold tracking-tight">
            {product.jacket}
          </h2>
          <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">$128.00</p>
        </div>
        <div className="space-y-2.5">
          <p className="text-sm text-[#1c1917]/60 dark:text-[#ece7dc]/60">{t.fit}</p>
          <OptionChips<Fit>
            locale={locale}
            aria-label={t.fit}
            size="sm"
            value={fit}
            onValueChange={setFit}
            options={(["regular", "relaxed"] as const).map((f) => ({ value: f, label: t.fits[f] }))}
          />
        </div>
        <VariantPicker
          locale={locale}
          sizeStyle="chips"
          colors={named(jacketSwatches)}
          sizes={sizes}
          stock={jacketStock}
          value={jacket}
          onChange={setJacket}
        />
        <AddButton disabled={!jacket.size}>{t.add}</AddButton>
      </section>
    </div>
  );
}
