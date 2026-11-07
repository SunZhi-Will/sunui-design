"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StoreHeader } from "./store-header";

const copy = {
  en: { notice: "Free shipping over $60", links: ["New", "Knitwear", "Home", "Sale"], headline: "Wool overshirts", hint: "Scroll down to tuck the header away.", add: "Add", products: [["Overshirt", "$128"], ["Beanie", "$32"], ["Mug", "$24"], ["Tote", "$40"]] },
  "zh-TW": { notice: "滿 $60 免運費", links: ["新品", "針織", "居家", "特價"], headline: "羊毛襯衫外套", hint: "往下捲，頁首會收起來。", add: "加入", products: [["襯衫外套", "$128"], ["毛帽", "$32"], ["馬克杯", "$24"], ["托特包", "$40"]] },
  "zh-CN": { notice: "满 $60 包邮", links: ["新品", "针织", "家居", "特价"], headline: "羊毛衬衫外套", hint: "向下滚动，页头会收起来。", add: "加入", products: [["衬衫外套", "$128"], ["毛线帽", "$32"], ["马克杯", "$24"], ["托特包", "$40"]] },
  ja: { notice: "$60 以上で送料無料", links: ["新着", "ニット", "ホーム", "セール"], headline: "ウールのシャツジャケット", hint: "下にスクロールするとヘッダーが隠れます。", add: "追加", products: [["シャツJKT", "$128"], ["ニット帽", "$32"], ["マグ", "$24"], ["トート", "$40"]] },
};

const hrefs = ["#new", "#knitwear", "#home", "#sale"];

/** 型錄卡片：手機寬的小店頁面，往下捲頁首收起、往上捲回來，點選單鈕展開分類，按「加入」購物車數字會跳。 */
export default function StoreHeaderCard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [count, setCount] = useState(2);

  return (
    <div ref={scrollRef} className="mx-auto h-[260px] w-80 overflow-y-auto rounded-lg border bg-background">
      <StoreHeader
        locale={locale}
        scrollContainer={scrollRef}
        brand="Field Supply"
        links={t.links.map((label, i) => ({ label, href: hrefs[i] }))}
        cartCount={count}
        announcement={<p className="bg-muted px-4 py-1 text-center text-[11px] text-muted-foreground">{t.notice}</p>}
      />
      <div className="px-4 py-4">
        <p className="text-lg font-semibold tracking-tight">{t.headline}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {t.products.map(([name, price]) => (
            <li key={name} className="flex flex-col gap-1.5">
              <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-muted" />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate">
                  {name} <span className="text-muted-foreground tabular-nums">{price}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCount((c) => c + 1)}
                  className="shrink-0 rounded-md border px-2 py-0.5 hover:bg-[#171717]/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:hover:bg-[#ededed]/10"
                >
                  {t.add}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
