"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StoreHeader } from "./store-header";

const copy = {
  en: {
    notice: "Free shipping on orders over $60",
    links: ["New", "Knitwear", "Home", "Sale"],
    eyebrow: "New this week",
    headline: "Wool overshirts, back in four colours",
    hint: "Scroll down to tuck the header away, scroll up to bring it back.",
    add: "Add",
    products: [
      ["Wool overshirt", "$128"],
      ["Linen tea towel", "$18"],
      ["Ribbed beanie", "$32"],
      ["Stoneware mug", "$24"],
      ["Canvas tote", "$40"],
      ["Merino socks", "$16"],
    ],
  },
  "zh-TW": {
    notice: "訂單滿 $60 免運費",
    links: ["新品", "針織", "居家", "特價"],
    eyebrow: "本週新品",
    headline: "羊毛襯衫外套，四色重新到貨",
    hint: "往下捲頁首會收起，往上捲立刻回來。",
    add: "加入",
    products: [
      ["羊毛襯衫外套", "$128"],
      ["亞麻茶巾", "$18"],
      ["羅紋毛帽", "$32"],
      ["石器馬克杯", "$24"],
      ["帆布托特包", "$40"],
      ["美麗諾羊毛襪", "$16"],
    ],
  },
  "zh-CN": {
    notice: "订单满 $60 包邮",
    links: ["新品", "针织", "家居", "特价"],
    eyebrow: "本周新品",
    headline: "羊毛衬衫外套，四色重新到货",
    hint: "向下滚动页头会收起，向上滚动立即回来。",
    add: "加入",
    products: [
      ["羊毛衬衫外套", "$128"],
      ["亚麻茶巾", "$18"],
      ["罗纹毛线帽", "$32"],
      ["石器马克杯", "$24"],
      ["帆布托特包", "$40"],
      ["美利奴羊毛袜", "$16"],
    ],
  },
  ja: {
    notice: "$60 以上のご注文で送料無料",
    links: ["新着", "ニット", "ホーム", "セール"],
    eyebrow: "今週の新着",
    headline: "ウールのシャツジャケット、4色で再入荷",
    hint: "下にスクロールするとヘッダーが隠れ、上に戻すとすぐ現れます。",
    add: "追加",
    products: [
      ["ウールシャツジャケット", "$128"],
      ["リネンのティータオル", "$18"],
      ["リブニット帽", "$32"],
      ["ストーンウェアのマグ", "$24"],
      ["キャンバストート", "$40"],
      ["メリノソックス", "$16"],
    ],
  },
};

const hrefs = ["#new", "#knitwear", "#home", "#sale"];

export default function StoreHeaderDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [count, setCount] = useState(2);

  return (
    <div ref={scrollRef} className="h-[30rem] w-full max-w-[52rem] overflow-y-auto rounded-lg border bg-background">
      <StoreHeader
        locale={locale}
        scrollContainer={scrollRef}
        brand="Field Supply"
        links={t.links.map((label, i) => ({ label, href: hrefs[i] }))}
        cartCount={count}
        announcement={<p className="bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">{t.notice}</p>}
      />
      <div className="px-4 py-8 sm:px-6">
        <p className="text-xs text-muted-foreground">{t.eyebrow}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-balance">{t.headline}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.hint}</p>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {t.products.map(([name, price]) => (
            <li key={name} className="flex flex-col gap-2">
              <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-muted" />
              <div className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{name}</span>
                  <span className="text-muted-foreground tabular-nums">{price}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCount((c) => c + 1)}
                  className="shrink-0 rounded-md border px-2.5 py-1 text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
