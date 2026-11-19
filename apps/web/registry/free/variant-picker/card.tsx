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

// Stock by color and size; combinations not listed count as sold out. White M is sold out
const stock: Record<string, number> = {
  "white:S": 10, "white:XL": 3,
  "fog:S": 7, "fog:M": 2, "fog:XL": 4,
  "black:S": 6, "black:M": 14, "black:L": 1, "black:XL": 5,
};

/** Catalog card: after picking M, switch to white. M is sold out in white but stays selected, and the hint line lists the colors that still have M. */
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
