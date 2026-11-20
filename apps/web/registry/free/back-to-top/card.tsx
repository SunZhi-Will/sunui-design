"use client";

import { useEffect, useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { BackToTop } from "./back-to-top";

const copy = {
  en: { title: "All knitwear", count: "48 products", label: "Back to top", item: "Merino crew", price: "$68" },
  "zh-TW": { title: "全部針織", count: "48 件商品", label: "回到頂端", item: "美麗諾圓領", price: "NT$1,980" },
  "zh-CN": { title: "全部针织", count: "48 件商品", label: "回到顶部", item: "美丽诺圆领", price: "¥468" },
  ja: { title: "ニット一覧", count: "48 件", label: "ページの先頭へ", item: "メリノ クルー", price: "¥9,900" },
};

/** Catalog card: a product list that is already scrolled down. The corner button shows scroll progress, and a click slides back to the top. */
export default function BackToTopCard() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);
  // Scroll to the middle at the start so the button and progress ring are visible on the card right away. Scroll only after the scroll listener is attached, otherwise the button does not appear
  useEffect(() => {
    const id = window.setTimeout(() => scroller.current?.scrollTo({ top: 220 }), 300);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="relative mx-auto h-60 w-80 overflow-hidden rounded-lg border bg-background">
      <div ref={scroller} className="h-full overflow-y-auto p-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-base font-semibold tracking-tight">{t.title}</h1>
          <span className="text-xs tabular-nums text-muted-foreground">{t.count}</span>
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 15 }, (_, i) => (
            <li key={i}>
              <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-muted" />
              <p className="mt-1.5 truncate text-xs">{t.item}</p>
              <p className="text-[11px] tabular-nums text-muted-foreground">{t.price}</p>
            </li>
          ))}
        </ul>
      </div>
      <BackToTop container={scroller} position="contained" threshold={120} label={t.label} />
    </div>
  );
}
