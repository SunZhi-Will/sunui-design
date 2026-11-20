"use client";

import { useDemoText } from "@/lib/demo-locale";

import { RibbonCarousel, type RibbonItem } from "./ribbon-carousel";

// 示範圖：同一組灰底棚拍單品照，放在 public/demo/looks/
const looks = ["coat-camel", "cardigan-navy", "turtleneck", "trousers-grey", "coat-navy", "field-jacket", "scarf-oat", "boots-black"];
const photo = (i: number) => `/demo/looks/${looks[i % looks.length]}.webp`;

type Copy = { eyebrow: string; heading: string; label: string; previous: string; next: string; looks: string[] };

const copy: { en: Copy } & Partial<Record<"zh-TW" | "zh-CN" | "ja", Copy>> = {
  en: {
    eyebrow: "New arrivals",
    heading: "The autumn line, look by look",
    label: "Autumn looks",
    previous: "Previous look",
    next: "Next look",
    looks: ["Camel wrap coat", "Navy wool cardigan", "Charcoal turtleneck", "Pleated grey trousers", "Navy pea coat", "Waxed field jacket", "Oat wool scarf", "Black Chelsea boots"],
  },
  "zh-TW": {
    eyebrow: "新品上市",
    heading: "秋季系列，一套一套看",
    label: "秋季穿搭",
    previous: "上一套",
    next: "下一套",
    looks: ["駝色綁帶大衣", "海軍藍羊毛開襟衫", "炭灰高領毛衣", "灰色打褶寬褲", "海軍藍雙排扣大衣", "蠟布獵裝外套", "燕麥色羊毛圍巾", "黑色切爾西靴"],
  },
  "zh-CN": {
    eyebrow: "新品上市",
    heading: "秋季系列，一套一套看",
    label: "秋季穿搭",
    previous: "上一套",
    next: "下一套",
    looks: ["驼色系带大衣", "海军蓝羊毛开衫", "炭灰高领毛衣", "灰色打褶阔腿裤", "海军蓝双排扣大衣", "蜡布猎装外套", "燕麦色羊毛围巾", "黑色切尔西靴"],
  },
  ja: {
    eyebrow: "新作",
    heading: "秋のコレクションを、ルックごとに",
    label: "秋のルック",
    previous: "前のルック",
    next: "次のルック",
    looks: ["キャメルのラップコート", "ネイビーのウールカーディガン", "チャコールのタートルネック", "グレーのタックワイドパンツ", "ネイビーのピーコート", "オイルドフィールドジャケット", "オートミールのウールマフラー", "ブラックのチェルシーブーツ"],
  },
};

export default function RibbonCarouselDemo() {
  const t = useDemoText(copy);
  const items: RibbonItem[] = t.looks.map((title, i) => ({ src: photo(i), alt: title, title }));

  return (
    <section className="w-full max-w-5xl px-4 py-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-foreground">{t.heading}</h2>
      <RibbonCarousel
        items={items}
        label={t.label}
        labels={{ previous: t.previous, next: t.next }}
        cardWidth={220}
        cardHeight={290}
        className="mt-6"
      />
    </section>
  );
}
