"use client";

import { useRef } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { ScrollRevealText } from "./scroll-reveal-text";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const copy = {
  en: {
    lang: "en",
    eyebrow: "2026 Anniversary Sale · Foreword",
    title: "November, a gift to this year's you.",
    dates: "Fri 11/7 to Mon 11/17 · Storewide",
    p1: "Every year there are a few things you want but leave sitting in your cart. For these eleven days, get $10 off every $100 storewide, members save another 10%, and checking out in the app earns 5% back.",
    accent: ["$10 off every $100"],
    p2: "No need to rush on day one. Write your list, browse slowly, and spend on things you will truly use for years.",
    footer: "Terms as posted in store. Some brands excluded.",
  },
  "zh-TW": {
    lang: "zh-Hant",
    eyebrow: "2026 週年慶　活動序言",
    title: "十一月，給一年的自己。",
    dates: "11/7（五）至 11/17（一）　全館同步",
    p1: "一年裡總有幾樣東西，想買卻一直放在購物車。週年慶這十一天，全館滿千送百，會員再享九折，App 結帳另有 5% 回饋。",
    accent: ["滿千送百"],
    p2: "不必搶在第一天。清單寫好，慢慢逛，把錢花在真正會用很久的東西上。",
    footer: "活動辦法以門市公告為準，部分品牌不適用。",
  },
  "zh-CN": {
    lang: "zh-Hans",
    eyebrow: "2026 周年庆　活动序言",
    title: "十一月，送给这一年的自己。",
    dates: "11/7（周五）至 11/17（周一）　全场同步",
    p1: "一年里总有几样东西，想买却一直躺在购物车里。周年庆这十一天，全场满千减百，会员再享九折，App 下单另有 5% 返现。",
    accent: ["满千减百"],
    p2: "不必抢在第一天。把清单列好，慢慢逛，把钱花在真正能用很久的东西上。",
    footer: "活动规则以门店公告为准，部分品牌不参与。",
  },
  ja: {
    lang: "ja",
    eyebrow: "2026 周年祭　ごあいさつ",
    title: "十一月、一年がんばった自分へ。",
    dates: "11/7（金）から 11/17（月）　全館同時開催",
    p1: "一年のあいだ、欲しいのにカートに入れたままのものがいくつかあるはず。周年祭の十一日間は、全館で千円ごとに百円引き、会員はさらに一割引き、アプリ決済なら 5% 還元も。",
    accent: ["千円ごとに百円引き"],
    p2: "初日に急がなくても大丈夫。リストを書いて、ゆっくり選んで、本当に長く使えるものにお金をかけましょう。",
    footer: "詳細は店頭の告知をご確認ください。一部対象外のブランドがあります。",
  },
};

export default function ScrollRevealTextDemo() {
  const scroller = useRef<HTMLDivElement>(null);
  const locale = useDemoLocale();
  const t = useDemoText(copy);

  return (
    <article lang={t.lang} className={cn("w-full max-w-2xl overflow-hidden rounded-md border", paper, edge, ink)}>
      <div ref={scroller} className="relative h-[440px] overflow-y-auto px-6 sm:px-12">
        <header className="pt-10 pb-24 sm:pt-14">
          <p className={cn("text-xs font-medium tracking-[0.2em]", inkMuted)}>{t.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[0.04em]">{t.title}</h2>
          <p className={cn("mt-3 text-sm", inkMuted)}>{t.dates}</p>
        </header>

        <ScrollRevealText
          container={scroller}
          locale={locale}
          lang={t.lang}
          text={t.p1}
          accentWords={t.accent}
          className="text-[1.375rem] leading-[1.8] tracking-[0.04em] sm:text-[1.75rem]"
        />

        <div className="h-24" />

        <ScrollRevealText
          container={scroller}
          locale={locale}
          lang={t.lang}
          text={t.p2}
          className="text-[1.375rem] leading-[1.8] tracking-[0.04em] sm:text-[1.75rem]"
        />

        <footer className={cn("mt-24 mb-10 border-t pt-4 text-sm", edge, inkMuted)}>{t.footer}</footer>
        <div className="h-28" />
      </div>
    </article>
  );
}
