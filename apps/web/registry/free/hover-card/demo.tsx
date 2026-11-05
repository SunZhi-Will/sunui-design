"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { HoverCard } from "./hover-card";

function Sketch({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 120 90" className="size-full bg-[#f1ece1] text-[#1c1917]/45 dark:bg-[#2a2620] dark:text-[#ece7dc]/40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const copy = {
  en: {
    heading: "Frequently bought together",
    tote: { name: "Washed linen tote", meta: "Natural, 38 x 42 cm" },
    mug: { name: "Stoneware mug", meta: "Ash glaze, 350 ml" },
    notebook: { name: "Dot grid notebook", meta: "A5, 160 pages" },
  },
  "zh-TW": {
    heading: "經常一起購買",
    tote: { name: "水洗亞麻托特包", meta: "原色，38 x 42 cm" },
    mug: { name: "石器馬克杯", meta: "灰釉，350 ml" },
    notebook: { name: "點陣筆記本", meta: "A5，160 頁" },
  },
  "zh-CN": {
    heading: "经常一起购买",
    tote: { name: "水洗亚麻托特包", meta: "原色，38 x 42 cm" },
    mug: { name: "石器马克杯", meta: "灰釉，350 ml" },
    notebook: { name: "点阵笔记本", meta: "A5，160 页" },
  },
  ja: {
    heading: "よく一緒に購入されている商品",
    tote: { name: "ウォッシュドリネンのトート", meta: "ナチュラル、38 x 42 cm" },
    mug: { name: "ストーンウェアのマグ", meta: "灰釉、350 ml" },
    notebook: { name: "ドット方眼ノート", meta: "A5、160ページ" },
  },
};

export default function HoverCardDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const price = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="w-full max-w-md rounded-md border border-border bg-card p-4 text-sm text-card-foreground sm:p-5">
      <p className="text-sm font-semibold tracking-tight">{t.heading}</p>
      <ul className="mt-3 divide-y divide-border">
        <li className="flex items-baseline justify-between gap-3 py-2.5">
          <HoverCard
            href="#linen-tote"
            locale={locale}
            onAddToCart={() => {}}
            product={{
              name: t.tote.name,
              meta: t.tote.meta,
              price: 32,
              compareAt: 40,
              image: <Sketch d="M30 35h60l-6 40H36zM45 35c0-12 30-12 30 0" />,
            }}
          >
            {t.tote.name}
          </HoverCard>
          <span className="text-muted-foreground tabular-nums">{price(32)}</span>
        </li>
        <li className="flex items-baseline justify-between gap-3 py-2.5">
          <HoverCard
            href="#mug"
            locale={locale}
            onAddToCart={() => {}}
            product={{
              name: t.mug.name,
              meta: t.mug.meta,
              price: 18,
              image: <Sketch d="M38 30h36v40a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6zM74 40h8a8 8 0 0 1 0 16h-8" />,
            }}
          >
            {t.mug.name}
          </HoverCard>
          <span className="text-muted-foreground tabular-nums">{price(18)}</span>
        </li>
        <li className="flex items-baseline justify-between gap-3 py-2.5">
          <HoverCard href="#notebook" locale={locale} onAddToCart={() => {}} product={{ name: t.notebook.name, meta: t.notebook.meta, price: 14 }}>
            {t.notebook.name}
          </HoverCard>
          <span className="text-muted-foreground tabular-nums">{price(14)}</span>
        </li>
      </ul>
    </div>
  );
}
