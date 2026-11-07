"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const swatches = [
  { id: "white", swatch: "#f4f4f4" },
  { id: "fog", swatch: "#c4c7c9" },
  { id: "black", swatch: "#242424" },
];

const copy = {
  en: { white: "White", fog: "Fog grey", black: "Black" },
  "zh-TW": { white: "白", fog: "霧灰", black: "黑" },
  "zh-CN": { white: "白", fog: "雾灰", black: "黑" },
  ja: { white: "ホワイト", fog: "フォググレー", black: "ブラック" },
};

const sizes = ["S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完。白色的 M 售完
const stock: Record<string, number> = {
  "white:S": 10, "white:XL": 3,
  "fog:S": 7, "fog:M": 2, "fog:XL": 4,
  "black:S": 6, "black:M": 14, "black:L": 1, "black:XL": 5,
};

/** 型錄卡片：選了 M 之後換到白色，M 在白色售完但沒有被清掉，提示行列出還有 M 的顏色。 */
export default function VariantPickerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const colors: VariantColor[] = swatches.map((c) => ({ ...c, name: t[c.id as keyof typeof t] }));
  const [variant, setVariant] = useState<VariantValue>({ color: "white", size: "M" });
  return (
    <div className="mx-auto w-72">
      <VariantPicker locale={locale} colors={colors} sizes={sizes} stock={stock} value={variant} onChange={setVariant} />
    </div>
  );
}
