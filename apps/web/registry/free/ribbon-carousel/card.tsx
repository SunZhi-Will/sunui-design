"use client";

import { useDemoText } from "@/lib/demo-locale";

import { RibbonCarousel, type RibbonItem } from "./ribbon-carousel";

// 示範圖：同一組灰底棚拍單品照，放在 public/demo/looks/
const looks = ["coat-camel", "cardigan-navy", "turtleneck", "trousers-grey", "coat-navy", "field-jacket", "scarf-oat", "boots-black"];
const photo = (i: number) => `/demo/looks/${looks[i % looks.length]}.webp`;

const copy = {
  en: { label: "Autumn looks", previous: "Previous look", next: "Next look", looks: ["Camel wrap coat", "Navy wool cardigan", "Charcoal turtleneck", "Pleated grey trousers", "Navy pea coat", "Waxed field jacket"] },
  "zh-TW": { label: "秋季穿搭", previous: "上一套", next: "下一套", looks: ["駝色綁帶大衣", "海軍藍羊毛開襟衫", "炭灰高領毛衣", "灰色打褶寬褲", "海軍藍雙排扣大衣", "蠟布獵裝外套"] },
  "zh-CN": { label: "秋季穿搭", previous: "上一套", next: "下一套", looks: ["驼色系带大衣", "海军蓝羊毛开衫", "炭灰高领毛衣", "灰色打褶阔腿裤", "海军蓝双排扣大衣", "蜡布猎装外套"] },
  ja: { label: "秋のルック", previous: "前のルック", next: "次のルック", looks: ["キャメルのラップコート", "ネイビーのウールカーディガン", "チャコールのタートルネック", "グレーのタックワイドパンツ", "ネイビーのピーコート", "オイルドフィールドジャケット"] },
};

/** 型錄卡片：穿搭照片沿著弧面排開，自動輪播，拖曳或按箭頭換下一套。 */
export default function RibbonCarouselCard() {
  const t = useDemoText(copy);
  const items: RibbonItem[] = t.looks.map((title, i) => ({ src: photo(i), alt: title, title }));
  return (
    <div className="w-[320px]">
      <RibbonCarousel
        items={items}
        label={t.label}
        labels={{ previous: t.previous, next: t.next }}
        cardWidth={136}
        cardHeight={180}
        radius={380}
        gap={14}
        autoplay
      />
    </div>
  );
}
