"use client";

import { useState } from "react";

import { VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const colors: VariantColor[] = [
  { id: "oat", name: "Oat", swatch: "#d9cdb8" },
  { id: "navy", name: "Navy", swatch: "#2b3448" },
  { id: "moss", name: "Moss", swatch: "#6b7354" },
  { id: "rust", name: "Rust", swatch: "#9a4a2e" },
];

const sizes = ["S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完
const stock: Record<string, number> = {
  "oat:S": 12, "oat:M": 2, "oat:L": 9,
  "navy:S": 6, "navy:M": 14, "navy:L": 1, "navy:XL": 5,
  "moss:M": 8, "moss:L": 7,
};

/** 型錄卡片：換顏色時尺寸跟著顯示庫存，售完的尺寸蓋上小章不能選。 */
export default function VariantPickerCard() {
  const [variant, setVariant] = useState<VariantValue>({ color: "oat", size: "M" });
  return (
    <div className="mx-auto w-72">
      <VariantPicker colors={colors} sizes={sizes} stock={stock} value={variant} onChange={setVariant} />
    </div>
  );
}
