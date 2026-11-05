"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { AvatarStack, type AvatarStackPerson } from "./avatar-stack";

const buyersByLocale: { en: AvatarStackPerson[] } & Record<"zh-TW" | "zh-CN" | "ja", AvatarStackPerson[]> = {
  en: [
    { id: "1", name: "Mina P.", note: "Taipei, 2 hours ago" },
    { id: "2", name: "Leo C.", note: "Osaka, 5 hours ago" },
    { id: "3", name: "Ava L.", note: "Seoul, yesterday" },
    { id: "4", name: "Noah W.", note: "Taichung, yesterday" },
    { id: "5", name: "Sara K.", note: "Singapore, 2 days ago" },
  ],
  "zh-TW": [
    { id: "1", name: "林美娜", note: "台北，2 小時前" },
    { id: "2", name: "陳立歐", note: "大阪，5 小時前" },
    { id: "3", name: "李艾娃", note: "首爾，昨天" },
    { id: "4", name: "王諾亞", note: "台中，昨天" },
    { id: "5", name: "柯莎拉", note: "新加坡，2 天前" },
  ],
  "zh-CN": [
    { id: "1", name: "林美娜", note: "台北，2 小时前" },
    { id: "2", name: "陈立欧", note: "大阪，5 小时前" },
    { id: "3", name: "李艾娃", note: "首尔，昨天" },
    { id: "4", name: "王诺亚", note: "台中，昨天" },
    { id: "5", name: "柯莎拉", note: "新加坡，2 天前" },
  ],
  ja: [
    { id: "1", name: "佐藤美奈", note: "台北、2 時間前" },
    { id: "2", name: "中村玲央", note: "大阪、5 時間前" },
    { id: "3", name: "鈴木彩", note: "ソウル、昨日" },
    { id: "4", name: "渡辺直人", note: "台中、昨日" },
    { id: "5", name: "加藤沙羅", note: "シンガポール、2 日前" },
  ],
};

const copy = {
  en: {
    blurb: "Double-wall steel, keeps drinks cold for 24 hours.",
    bought: "bought in the last 30 days",
    addToCart: "Add to cart",
    together: "Often bought together",
    buyersOf: (name: string) => `Buyers of ${name}`,
  },
  "zh-TW": {
    blurb: "雙層不鏽鋼，飲料保冰 24 小時。",
    bought: "人在過去 30 天購買",
    addToCart: "加入購物車",
    together: "經常一起購買",
    buyersOf: (name: string) => `${name}的買家`,
  },
  "zh-CN": {
    blurb: "双层不锈钢，饮品保冷 24 小时。",
    bought: "人在过去 30 天购买",
    addToCart: "加入购物车",
    together: "经常一起购买",
    buyersOf: (name: string) => `${name}的买家`,
  },
  ja: {
    blurb: "二重構造のステンレスで、飲み物を 24 時間冷たく保ちます。",
    bought: "人が過去 30 日間に購入",
    addToCart: "カートに入れる",
    together: "よく一緒に購入されている商品",
    buyersOf: (name: string) => `${name}の購入者`,
  },
};

const related: { kind: ProductKind; price: string; buyers: number }[] = [
  { kind: "mug", price: "$24", buyers: 412 },
  { kind: "tote", price: "$36", buyers: 96 },
];

export default function AvatarStackDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const buyers = useDemoText(buyersByLocale);
  const productNames = useProductNames();

  return (
    <div className="grid w-full max-w-3xl gap-6 text-foreground md:grid-cols-[1.4fr_1fr]">
      <article className="grid gap-5 rounded-md border border-border bg-card p-4 sm:grid-cols-[9rem_1fr] sm:p-5">
        <ProductArt kind="bottle" className="rounded-[3px] max-sm:aspect-[16/9]" />
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight">{productNames.bottle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
          <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums">$32</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-border pt-4">
            <AvatarStack people={buyers} total={1284} max={4} locale={locale} />
            <p className="min-w-[9rem] flex-1 text-xs leading-snug text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{new Intl.NumberFormat(locale).format(1284)}</span> {t.bought}
            </p>
          </div>
          <button
            type="button"
            className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:w-fit"
          >
            {t.addToCart}
          </button>
        </div>
      </article>

      <section aria-labelledby="related-heading" className="space-y-3">
        <h3 id="related-heading" className="text-sm font-semibold">
          {t.together}
        </h3>
        <ul className="space-y-3">
          {related.map((r) => (
            <li key={r.kind} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
              <ProductArt kind={r.kind} className="size-14 shrink-0 rounded-[3px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{productNames[r.kind]}</p>
                <p className="text-sm tracking-tight tabular-nums">{r.price}</p>
              </div>
              <AvatarStack people={buyers.slice(r.kind === "mug" ? 1 : 3, r.kind === "mug" ? 4 : 5)} total={r.buyers} max={2} size="sm" locale={locale} label={t.buyersOf(productNames[r.kind])} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
