"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const swatches = [
  { id: "oat", swatch: "#d9cdb8" },
  { id: "navy", swatch: "#2b3448" },
  { id: "moss", swatch: "#6b7354" },
  { id: "rust", swatch: "#9a4a2e" },
];

const copy = {
  en: { oat: "Oat", navy: "Navy", moss: "Moss", rust: "Rust", title: "Heavyweight Cotton Tee", add: "Add to cart" },
  "zh-TW": { oat: "燕麥", navy: "海軍藍", moss: "苔綠", rust: "鏽紅", title: "厚磅純棉 T 恤", add: "加入購物車" },
  "zh-CN": { oat: "燕麦", navy: "海军蓝", moss: "苔绿", rust: "锈红", title: "重磅纯棉 T 恤", add: "加入购物车" },
  ja: { oat: "オート", navy: "ネイビー", moss: "モス", rust: "ラスト", title: "ヘビーウェイト コットンT", add: "カートに追加" },
};

const sizes = ["XS", "S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完
const stock: Record<string, number> = {
  "oat:XS": 4, "oat:S": 12, "oat:M": 2, "oat:L": 9, "oat:XL": 0,
  "navy:S": 6, "navy:M": 14, "navy:L": 1, "navy:XL": 5,
  "moss:XS": 3, "moss:M": 8, "moss:L": 7,
};

export default function VariantPickerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const colors: VariantColor[] = swatches.map((c) => ({ ...c, name: t[c.id as keyof typeof t] }));
  const [variant, setVariant] = useState<VariantValue>({ color: "oat", size: "M" });
  const swatch = colors.find((c) => c.id === variant.color)?.swatch ?? "#d9cdb8";

  return (
    <section aria-labelledby="variant-heading" className="grid w-full max-w-[52rem] items-start gap-6 md:grid-cols-2">
      {/* 中性實物插圖：上衣輪廓跟著所選顏色換色 */}
      <div className="grid aspect-square place-items-center rounded-md border border-[#e7e0d0] bg-[#faf7f0] dark:border-[#38332b] dark:bg-[#1f1c18]">
        <svg viewBox="0 0 120 120" className="w-3/5" aria-hidden="true">
          <path
            d="M44 18 30 24 12 40l12 16 10-7v53h52V49l10 7 12-16-18-16-14-6c-2 7-8 11-16 11s-14-4-16-11Z"
            fill={swatch}
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="space-y-4">
        <div>
          <h2 id="variant-heading" className="text-xl font-semibold tracking-tight">
            {t.title}
          </h2>
          <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums">$38.00</p>
        </div>
        <VariantPicker locale={locale} colors={colors} sizes={sizes} stock={stock} value={variant} onChange={setVariant} />
        <button
          type="button"
          disabled={!variant.size}
          className="h-11 w-full max-w-sm rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {t.add}
        </button>
      </div>
    </section>
  );
}
