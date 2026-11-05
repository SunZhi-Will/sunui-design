"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { OptionChips, VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const swatches = [
  { id: "oat", swatch: "#d9cdb8" },
  { id: "navy", swatch: "#2b3448" },
  { id: "moss", swatch: "#6b7354" },
  { id: "rust", swatch: "#9a4a2e" },
];

const copy = {
  en: { oat: "Oat", navy: "Navy", moss: "Moss", rust: "Rust", fit: "Fit", regular: "Regular", relaxed: "Relaxed" },
  "zh-TW": { oat: "燕麥", navy: "海軍藍", moss: "苔綠", rust: "鏽紅", fit: "版型", regular: "標準", relaxed: "寬鬆" },
  "zh-CN": { oat: "燕麦", navy: "海军蓝", moss: "苔绿", rust: "锈红", fit: "版型", regular: "标准", relaxed: "宽松" },
  ja: { oat: "オート", navy: "ネイビー", moss: "モス", rust: "ラスト", fit: "シルエット", regular: "レギュラー", relaxed: "リラックス" },
};

const sizes = ["S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完
const stock: Record<string, number> = {
  "oat:S": 12, "oat:M": 2, "oat:L": 9,
  "navy:S": 6, "navy:M": 14, "navy:L": 1, "navy:XL": 5,
  "moss:M": 8, "moss:L": 7,
};

/** 型錄卡片：版型用滑動外框的文字膠囊，換顏色時尺寸跟著顯示庫存，售完的尺寸蓋上小章不能選。 */
export default function VariantPickerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const colors: VariantColor[] = swatches.map((c) => ({ ...c, name: t[c.id as "oat" | "navy" | "moss" | "rust"] }));
  const [variant, setVariant] = useState<VariantValue>({ color: "oat", size: "M" });
  const [fit, setFit] = useState<"regular" | "relaxed">("regular");
  return (
    <div className="mx-auto w-72 space-y-5">
      <OptionChips
        locale={locale}
        aria-label={t.fit}
        size="sm"
        value={fit}
        onValueChange={setFit}
        options={(["regular", "relaxed"] as const).map((f) => ({ value: f, label: t[f] }))}
      />
      <VariantPicker locale={locale} colors={colors} sizes={sizes} stock={stock} value={variant} onChange={setVariant} />
    </div>
  );
}
