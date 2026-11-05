"use client";

import { useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { BackToTop } from "./back-to-top";

const copy = {
  en: { title: "All knitwear", count: "48 products", hint: "Scroll the list", label: "Back to top", item: "Merino crew neck", price: "$68" },
  "zh-TW": { title: "全部針織", count: "48 件商品", hint: "往下捲動清單", label: "回到頂端", item: "美麗諾圓領針織衫", price: "NT$1,980" },
  "zh-CN": { title: "全部针织", count: "48 件商品", hint: "向下滚动列表", label: "回到顶部", item: "美丽诺圆领针织衫", price: "¥468" },
  ja: { title: "ニット一覧", count: "48 件", hint: "リストをスクロール", label: "ページの先頭へ", item: "メリノ クルーネック", price: "¥9,900" },
};

export default function BackToTopDemo() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="relative h-[28rem] w-full max-w-2xl overflow-hidden rounded-lg border bg-background">
      <div ref={scroller} className="h-full overflow-y-auto p-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
          <span className="text-sm tabular-nums text-muted-foreground">{t.count}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 18 }, (_, i) => (
            <li key={i}>
              <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-muted" />
              <p className="mt-2 text-sm">{t.item}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{t.price}</p>
            </li>
          ))}
        </ul>
      </div>
      <BackToTop container={scroller} position="contained" threshold={200} label={t.label} />
    </div>
  );
}
