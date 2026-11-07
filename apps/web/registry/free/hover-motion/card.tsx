"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { HoverPreviewList, InkUnderline, TextRoll } from "./hover-motion";

const copy = {
  en: {
    nav: ["New in", "Knitwear", "Journal"],
    rows: [
      { id: "1", title: "Merino crew neck", meta: "$68" },
      { id: "2", title: "Waxed field jacket", meta: "$184" },
      { id: "3", title: "Corduroy trousers", meta: "$92" },
    ],
  },
  "zh-TW": {
    nav: ["新品", "針織", "選物誌"],
    rows: [
      { id: "1", title: "美麗諾圓領針織衫", meta: "NT$1,980" },
      { id: "2", title: "上蠟野外夾克", meta: "NT$5,480" },
      { id: "3", title: "燈芯絨長褲", meta: "NT$2,680" },
    ],
  },
  "zh-CN": {
    nav: ["新品", "针织", "选物志"],
    rows: [
      { id: "1", title: "美丽诺圆领针织衫", meta: "¥468" },
      { id: "2", title: "上蜡野外夹克", meta: "¥1,280" },
      { id: "3", title: "灯芯绒长裤", meta: "¥628" },
    ],
  },
  ja: {
    nav: ["新着", "ニット", "読みもの"],
    rows: [
      { id: "1", title: "メリノ クルーネック", meta: "¥9,900" },
      { id: "2", title: "ワックス ジャケット", meta: "¥27,500" },
      { id: "3", title: "コーデュロイ パンツ", meta: "¥13,200" },
    ],
  },
};

const tones = ["bg-[#e2e2e2]", "bg-[#cdcdcd]", "bg-[#bfbfbf]"];

/** 型錄卡片：選單滑過時文字上捲、底線墨水般畫出；滑過商品列，預覽圖跟著游標浮出來。 */
export default function HoverMotionCard() {
  const t = useDemoText(copy);
  const [hoverNav, setHoverNav] = useState<number | null>(null);
  return (
    <div className="w-80 overflow-hidden rounded-lg border bg-background">
      <nav className="flex gap-5 border-b px-4 py-3 text-sm">
        {t.nav.map((label, i) => (
          <InkUnderline
            key={label}
            href="#"
            active={i === 1}
            onClick={(e: Event) => e.preventDefault()}
            onPointerEnter={() => setHoverNav(i)}
            onPointerLeave={() => setHoverNav(null)}
          >
            <TextRoll hovered={hoverNav === i}>{label}</TextRoll>
          </InkUnderline>
        ))}
      </nav>
      <div className="px-4 py-2">
        <HoverPreviewList
          previewSize={{ width: 96, height: 120 }}
          items={t.rows.map((row, i) => ({
            ...row,
            preview: (
              <div className={`flex h-full items-end p-2 text-[11px] text-[#171717]/70 ${tones[i]}`}>
                <span>{row.meta}</span>
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}
