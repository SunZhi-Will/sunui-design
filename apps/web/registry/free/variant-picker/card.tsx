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
  en: { oat: "Oat", navy: "Navy", moss: "Moss", rust: "Rust" },
  "zh-TW": { oat: "燕麥", navy: "海軍藍", moss: "苔綠", rust: "鏽紅" },
  "zh-CN": { oat: "燕麦", navy: "海军蓝", moss: "苔绿", rust: "锈红" },
  ja: { oat: "オート", navy: "ネイビー", moss: "モス", rust: "ラスト" },
};

const sizes = ["S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完
const stock: Record<string, number> = {
  "oat:S": 12, "oat:M": 2, "oat:L": 9,
  "navy:S": 6, "navy:M": 14, "navy:L": 1, "navy:XL": 5,
  "moss:M": 8, "moss:L": 7,
};

/** 型錄卡片：換顏色時尺寸跟著顯示庫存，售完的尺寸蓋上小章不能選。 */
export default function VariantPickerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const colors: VariantColor[] = swatches.map((c) => ({ ...c, name: t[c.id as keyof typeof t] }));
  const [variant, setVariant] = useState<VariantValue>({ color: "oat", size: "M" });
  return (
    <div className="mx-auto w-72">
      <VariantPicker locale={locale} colors={colors} sizes={sizes} stock={stock} value={variant} onChange={setVariant} />
    </div>
  );
}
