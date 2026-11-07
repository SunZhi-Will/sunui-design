"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { MorphMenu, type MorphMenuItem } from "./morph-menu";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Sketch({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 48 48" className="size-12 shrink-0 rounded-md bg-[#ececec] text-[#171717]/45 dark:bg-[#272727] dark:text-[#ededed]/40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const copy = {
  en: {
    heading: "Saved for later",
    count: "3 items",
    moveToCart: "Move to cart",
    size: "Change size",
    share: "Share",
    notify: "Notify me when back",
    remove: "Remove",
    rows: [
      { name: "Washed linen tote", meta: "Natural, 38 x 42 cm" },
      { name: "Stoneware mug", meta: "Ash glaze, 350 ml" },
      { name: "Merino crew sock", meta: "Charcoal, size M · Sold out" },
    ],
  },
  "zh-TW": {
    heading: "稍後購買",
    count: "3 件",
    moveToCart: "移到購物車",
    size: "更換尺寸",
    share: "分享",
    notify: "補貨時通知我",
    remove: "移除",
    rows: [
      { name: "水洗亞麻托特包", meta: "原色，38 x 42 cm" },
      { name: "石器馬克杯", meta: "灰釉，350 ml" },
      { name: "美麗諾圓筒襪", meta: "炭灰，M · 已售完" },
    ],
  },
  "zh-CN": {
    heading: "稍后购买",
    count: "3 件",
    moveToCart: "移到购物车",
    size: "更换尺码",
    share: "分享",
    notify: "到货时通知我",
    remove: "移除",
    rows: [
      { name: "水洗亚麻托特包", meta: "原色，38 x 42 cm" },
      { name: "石器马克杯", meta: "灰釉，350 ml" },
      { name: "美丽诺圆筒袜", meta: "炭灰，M · 已售罄" },
    ],
  },
  ja: {
    heading: "あとで買う",
    count: "3点",
    moveToCart: "カートに移動",
    size: "サイズを変更",
    share: "共有",
    notify: "再入荷を通知",
    remove: "削除",
    rows: [
      { name: "ウォッシュドリネンのトート", meta: "ナチュラル、38 x 42 cm" },
      { name: "ストーンウェアのマグ", meta: "灰釉、350 ml" },
      { name: "メリノのクルーソックス", meta: "チャコール、M · 売り切れ" },
    ],
  },
};

const sketches = [
  "M12 18h24l-3 20H15zM19 18c0-7 10-7 10 0",
  "M14 14h16v20a3 3 0 0 1-3 3h-10a3 3 0 0 1-3-3zM30 19h4a4 4 0 0 1 0 8h-4",
  "M20 10h10v18l6 6a4 4 0 0 1-6 5l-10-9z",
];

export default function MorphMenuDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const price = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n);

  const actions = (soldOut: boolean): MorphMenuItem[] => [
    soldOut
      ? { id: "notify", label: t.notify, icon: <Icon d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3" /> }
      : { id: "cart", label: t.moveToCart, icon: <Icon d="M2 3h2l1.5 7h7L14 5H5" /> },
    { id: "size", label: t.size, icon: <Icon d="M3 8h10M3 8l2.5-2.5M3 8l2.5 2.5M13 8l-2.5-2.5M13 8l-2.5 2.5" />, disabled: soldOut },
    { id: "share", label: t.share, icon: <Icon d="M8 2v8M5 5l3-3 3 3M3 9v4h10V9" /> },
    { id: "remove", label: t.remove, icon: <Icon d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />, danger: true, separator: true },
  ];

  return (
    <div className="w-full max-w-md rounded-md border border-border bg-card p-4 text-sm text-card-foreground sm:p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold tracking-tight">{t.heading}</p>
        <span className="text-xs text-muted-foreground tabular-nums">{t.count}</span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {t.rows.map((row, i) => (
          <li key={row.name} className="flex items-center gap-3 py-3">
            <Sketch d={sketches[i]} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
            </div>
            <span className="text-muted-foreground tabular-nums">{price([32, 18, 14][i])}</span>
            <MorphMenu locale={locale} items={actions(i === 2)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
