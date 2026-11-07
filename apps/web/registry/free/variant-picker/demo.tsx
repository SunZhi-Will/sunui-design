"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";
import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { OptionChips, VariantPicker, type VariantColor, type VariantValue } from "./variant-picker";

const teeSwatches = [
  { id: "white", swatch: "#f4f4f4" },
  { id: "fog", swatch: "#c4c7c9" },
  { id: "black", swatch: "#242424" },
  { id: "moss", swatch: "#6b7354" },
];

const jacketSwatches = [
  { id: "oat", swatch: "#cdcdcd" },
  { id: "clay", swatch: "#a5634a" },
  { id: "ink", swatch: "#2b2926" },
];

type Fit = "regular" | "relaxed";

const copy = {
  en: {
    names: { white: "White", fog: "Fog grey", black: "Black", moss: "Moss", oat: "Oat", clay: "Clay", ink: "Ink" },
    title: "Heavyweight Cotton Tee",
    fit: "Fit",
    fits: { regular: "Regular", relaxed: "Relaxed" },
    add: "Add to cart",
  },
  "zh-TW": {
    names: { white: "白", fog: "霧灰", black: "黑", moss: "苔綠", oat: "燕麥", clay: "陶土", ink: "墨黑" },
    title: "厚磅純棉 T 恤",
    fit: "版型",
    fits: { regular: "標準", relaxed: "寬鬆" },
    add: "加入購物車",
  },
  "zh-CN": {
    names: { white: "白", fog: "雾灰", black: "黑", moss: "苔绿", oat: "燕麦", clay: "陶土", ink: "墨黑" },
    title: "重磅纯棉 T 恤",
    fit: "版型",
    fits: { regular: "标准", relaxed: "宽松" },
    add: "加入购物车",
  },
  ja: {
    names: { white: "ホワイト", fog: "フォググレー", black: "ブラック", moss: "モス", oat: "オート", clay: "クレイ", ink: "インク" },
    title: "ヘビーウェイト コットンT",
    fit: "シルエット",
    fits: { regular: "レギュラー", relaxed: "リラックス" },
    add: "カートに追加",
  },
};

const sizes = ["XS", "S", "M", "L", "XL"].map((s) => ({ id: s, label: s }));

// 依顏色與尺寸的庫存；沒列到的組合視為售完。白色的 M、L 售完，霧灰的 L 售完，苔綠整色售完
const teeStock: Record<string, number> = {
  "white:XS": 4, "white:S": 10, "white:XL": 3,
  "fog:XS": 3, "fog:S": 7, "fog:M": 2, "fog:XL": 4,
  "black:S": 6, "black:M": 14, "black:L": 1, "black:XL": 5,
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

/** 兩張商品卡並排：T 恤用紙面尺寸格、摘要行與到貨通知，外套用滑動外框的文字膠囊（另有獨立的版型選項） */
export default function VariantPickerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const product = useProductNames();
  const named = (list: { id: string; swatch: string }[]): VariantColor[] =>
    list.map((c) => ({ ...c, name: t.names[c.id as keyof typeof t.names] }));
  const [tee, setTee] = useState<VariantValue>({ color: "white" });
  const [teeOk, setTeeOk] = useState(false);
  const [jacket, setJacket] = useState<VariantValue>({ color: "clay", size: "M" });
  const [jacketOk, setJacketOk] = useState(true);
  const [fit, setFit] = useState<Fit>("regular");
  const teeSwatch = teeSwatches.find((c) => c.id === tee.color)?.swatch ?? "#f4f4f4";
  const ref = useRef<HTMLElement>(null);

  // 預覽自己演：先懸停看霧灰與黑的庫存，選黑、選 M；換到白色時 M 售完但保留，提示哪裡還有；
  // 最後點白色售完的 L，登記到貨通知
  const cursor = useDemoAutoplay(ref, async (d) => {
    const swatch = (id: keyof typeof t.names) => () => d.find(`[role=radio][aria-label="${t.names[id]}"]`);
    const size = (s: string) => () => d.find(`fieldset:nth-of-type(2) [role=radio][aria-label^="${s}"]`);
    await d.hover(swatch("fog"));
    await d.wait(1300);
    await d.hover(swatch("black"));
    await d.wait(1000);
    await d.click(swatch("black"));
    await d.unhover(swatch("black"));
    await d.wait(700);
    await d.click(size("M"));
    await d.wait(1000);
    await d.click(swatch("white"));
    await d.wait(1800);
    await d.click(size("L"));
    await d.wait(1200);
    await d.click(() => d.find("button:has(> svg)"));
  });

  return (
    <div className="grid w-full max-w-[52rem] min-w-0 items-start gap-6 md:grid-cols-2">
      <section ref={ref} aria-labelledby="vp-tee" className="relative min-w-0 space-y-4">
        {/* 中性實物插圖：上衣輪廓跟著所選顏色換色 */}
        <div className="grid aspect-[4/3] place-items-center rounded-md border border-[#e2e2e2] bg-[#f7f7f7] dark:border-[#333333] dark:bg-[#1c1c1c]">
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
        <VariantPicker
          locale={locale}
          colors={named(teeSwatches)}
          sizes={sizes}
          stock={teeStock}
          value={tee}
          onChange={(v, info) => {
            setTee(v);
            setTeeOk(info.available);
          }}
          onNotify={() => {}}
          showSummary
        />
        <AddButton disabled={!teeOk}>{t.add}</AddButton>
        {cursor}
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
          <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">{t.fit}</p>
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
          onChange={(v, info) => {
            setJacket(v);
            setJacketOk(info.available);
          }}
        />
        <AddButton disabled={!jacketOk}>{t.add}</AddButton>
      </section>
    </div>
  );
}
