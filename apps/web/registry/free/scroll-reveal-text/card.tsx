"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { ScrollRevealText } from "./scroll-reveal-text";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";

/** 型錄卡片：在框內往下捲，段落文字逐字由淡墨轉為實墨，強調詞以朱紅印出。 */
export default function ScrollRevealTextCard() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <article lang="zh-Hant" className={cn("mx-auto w-72 overflow-hidden rounded-md border", paper, edge, ink)}>
      <div ref={scroller} className="relative h-[210px] overflow-y-auto px-5">
        <div className="h-20" />
        <ScrollRevealText
          container={scroller}
          lang="zh-Hant"
          text="一年裡總有幾樣東西，想買卻一直放在購物車。週年慶這十一天，全館滿千送百，會員再享九折。"
          accentWords={["滿千送百"]}
          className="text-[1.25rem] leading-[1.8] tracking-[0.04em]"
        />
        <div className="h-40" />
      </div>
    </article>
  );
}
