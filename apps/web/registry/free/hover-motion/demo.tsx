"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { HoverPreviewList, InkUnderline, Magnetic, TextRoll } from "./hover-motion";

const copy = {
  en: {
    store: "Field Goods",
    nav: ["New in", "Knitwear", "Outerwear", "Journal"],
    title: "Lookbook, autumn",
    rows: [
      { id: "1", title: "Merino crew neck", meta: "$68" },
      { id: "2", title: "Waxed field jacket", meta: "$184" },
      { id: "3", title: "Corduroy trousers", meta: "$92" },
      { id: "4", title: "Lambswool scarf", meta: "$36" },
    ],
    cta: "Shop the collection",
  },
  "zh-TW": {
    store: "田野選物",
    nav: ["新品", "針織", "外套", "選物誌"],
    title: "秋季型錄",
    rows: [
      { id: "1", title: "美麗諾圓領針織衫", meta: "NT$1,980" },
      { id: "2", title: "上蠟野外夾克", meta: "NT$5,480" },
      { id: "3", title: "燈芯絨長褲", meta: "NT$2,680" },
      { id: "4", title: "小羊毛圍巾", meta: "NT$1,080" },
    ],
    cta: "逛逛這一季",
  },
  "zh-CN": {
    store: "田野选物",
    nav: ["新品", "针织", "外套", "选物志"],
    title: "秋季型录",
    rows: [
      { id: "1", title: "美丽诺圆领针织衫", meta: "¥468" },
      { id: "2", title: "上蜡野外夹克", meta: "¥1,280" },
      { id: "3", title: "灯芯绒长裤", meta: "¥628" },
      { id: "4", title: "小羊毛围巾", meta: "¥258" },
    ],
    cta: "逛逛这一季",
  },
  ja: {
    store: "フィールドグッズ",
    nav: ["新着", "ニット", "アウター", "読みもの"],
    title: "秋のルックブック",
    rows: [
      { id: "1", title: "メリノ クルーネック", meta: "¥9,900" },
      { id: "2", title: "ワックス フィールドジャケット", meta: "¥27,500" },
      { id: "3", title: "コーデュロイ パンツ", meta: "¥13,200" },
      { id: "4", title: "ラムウール マフラー", meta: "¥5,500" },
    ],
    cta: "コレクションを見る",
  },
};

const tones = ["bg-[#e2e2e2]", "bg-[#cdcdcd]", "bg-[#bfbfbf]", "bg-[#d4d4d4]"];

export default function HoverMotionDemo() {
  const t = useDemoText(copy);
  const [hoverNav, setHoverNav] = useState<number | null>(null);
  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-lg border bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <span className="font-semibold tracking-tight">{t.store}</span>
        <nav className="flex flex-wrap gap-5 text-sm">
          {t.nav.map((label, i) => (
            <InkUnderline key={label} href="#" active={i === 1} onClick={(e: Event) => e.preventDefault()} onPointerEnter={() => setHoverNav(i)} onPointerLeave={() => setHoverNav(null)}>
              <TextRoll hovered={hoverNav === i}>{label}</TextRoll>
            </InkUnderline>
          ))}
        </nav>
      </header>
      <div className="p-6">
        <p className="mb-4 text-xs text-muted-foreground">{t.title}</p>
        <HoverPreviewList
          previewSize={{ width: 160, height: 200 }}
          items={t.rows.map((row, i) => ({
            ...row,
            preview: (
              <div className={`flex h-full items-end p-3 text-xs text-[#171717]/70 dark:text-[#171717]/70 ${tones[i]}`}>
                <span>{row.meta}</span>
              </div>
            ),
          }))}
        />
        <div className="mt-8 flex justify-center">
          <Magnetic>
            <button type="button" className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground">
              <TextRoll>{t.cta}</TextRoll>
            </button>
          </Magnetic>
        </div>
      </div>
    </div>
  );
}
