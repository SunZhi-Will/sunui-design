"use client";

import { useRef } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { ScrollRevealText } from "./scroll-reveal-text";

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";

const copy = {
  en: {
    lang: "en",
    text: "Every year there are a few things you want but leave in your cart. For these eleven days, get $10 off every $100 storewide, and members save another 10%.",
    accent: ["$10 off every $100"],
  },
  "zh-TW": {
    lang: "zh-Hant",
    text: "一年裡總有幾樣東西，想買卻一直放在購物車。週年慶這十一天，全館滿千送百，會員再享九折。",
    accent: ["滿千送百"],
  },
  "zh-CN": {
    lang: "zh-Hans",
    text: "一年里总有几样东西，想买却一直躺在购物车里。周年庆这十一天，全场满千减百，会员再享九折。",
    accent: ["满千减百"],
  },
  ja: {
    lang: "ja",
    text: "一年のあいだ、欲しいのにカートに入れたままのものがいくつか。周年祭の十一日間は、全館で千円ごとに百円引き、会員はさらに一割引き。",
    accent: ["千円ごとに百円引き"],
  },
};

/** 型錄卡片：在框內往下捲，段落文字逐字由淡墨轉為實墨，強調詞以朱紅印出。 */
export default function ScrollRevealTextCard() {
  const scroller = useRef<HTMLDivElement>(null);
  const locale = useDemoLocale();
  const t = useDemoText(copy);

  return (
    <article lang={t.lang} className={cn("mx-auto w-72 overflow-hidden rounded-md border", paper, edge, ink)}>
      <div ref={scroller} className="relative h-[210px] overflow-y-auto px-5">
        <div className="h-20" />
        <ScrollRevealText
          container={scroller}
          locale={locale}
          lang={t.lang}
          text={t.text}
          accentWords={t.accent}
          className="text-[1.25rem] leading-[1.8] tracking-[0.04em]"
        />
        <div className="h-40" />
      </div>
    </article>
  );
}
