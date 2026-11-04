"use client";

import { useState } from "react";

import { VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const colors: VariantColor[] = [
  { id: "oat", name: "Oat", swatch: "#d9cdb8" },
  { id: "navy", name: "Navy", swatch: "#2b3448" },
  { id: "moss", name: "Moss", swatch: "#6b7354" },
  { id: "rust", name: "Rust", swatch: "#9a4a2e" },
];

const sizes = ["XS", "S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完
const stock: Record<string, number> = {
  "oat:XS": 4, "oat:S": 12, "oat:M": 2, "oat:L": 9, "oat:XL": 0,
  "navy:S": 6, "navy:M": 14, "navy:L": 1, "navy:XL": 5,
  "moss:XS": 3, "moss:M": 8, "moss:L": 7,
};

export default function VariantPickerDemo() {
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
            Heavyweight Cotton Tee
          </h2>
          <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums">$38.00</p>
        </div>
        <VariantPicker colors={colors} sizes={sizes} stock={stock} value={variant} onChange={setVariant} />
        <button
          type="button"
          disabled={!variant.size}
          className="h-11 w-full max-w-sm rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Add to cart
        </button>
      </div>
    </section>
  );
}
