"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { ScrollRevealText } from "./scroll-reveal-text";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

export default function ScrollRevealTextDemo() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <article lang="zh-Hant" className={cn("w-full max-w-2xl overflow-hidden rounded-md border", paper, edge, ink)}>
      <div ref={scroller} className="relative h-[440px] overflow-y-auto px-6 sm:px-12">
        <header className="pt-10 pb-24 sm:pt-14">
          <p className={cn("text-xs font-medium tracking-[0.2em]", inkMuted)}>2026 週年慶　活動序言</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[0.04em]">十一月，給一年的自己。</h2>
          <p className={cn("mt-3 text-sm", inkMuted)}>11/7（五）至 11/17（一）　全館同步</p>
        </header>

        <ScrollRevealText
          container={scroller}
          lang="zh-Hant"
          text="一年裡總有幾樣東西，想買卻一直放在購物車。週年慶這十一天，全館滿千送百，會員再享九折，App 結帳另有 5% 回饋。"
          accentWords={["滿千送百"]}
          className="text-[1.375rem] leading-[1.8] tracking-[0.04em] sm:text-[1.75rem]"
        />

        <div className="h-24" />

        <ScrollRevealText
          container={scroller}
          lang="zh-Hant"
          text="不必搶在第一天。清單寫好，慢慢逛，把錢花在真正會用很久的東西上。"
          className="text-[1.375rem] leading-[1.8] tracking-[0.04em] sm:text-[1.75rem]"
        />

        <footer className={cn("mt-24 mb-10 border-t pt-4 text-sm", edge, inkMuted)}>
          活動辦法以門市公告為準，部分品牌不適用。
        </footer>
        <div className="h-28" />
      </div>
    </article>
  );
}
