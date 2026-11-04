"use client";

import { cn } from "@/lib/utils";

import { CjkHeading } from "./cjk-heading";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

export default function CjkHeadingDemo() {
  return (
    <section lang="zh-Hant" className={cn("grid w-full max-w-4xl gap-4 md:grid-cols-[1fr_auto]", ink)}>
      {/* 橫排：活動頁主視覺 */}
      <div className={cn("flex flex-col justify-between gap-8 rounded-md border p-6 sm:p-9", paper, edge)}>
        <div className="space-y-5">
          <p className={cn("text-xs font-medium tracking-[0.2em]", inkMuted)}>2026 週年慶　全館同步</p>
          <CjkHeading
            as="h2"
            text={"「週年慶」滿千送百，\n會員再享9折。"}
            highlight={["滿千送百"]}
          />
          <CjkHeading
            as="p"
            text={"11月7日起，\nApp獨享加碼5%回饋。"}
            highlight={["5%回饋"]}
            className="text-xl font-semibold sm:text-2xl"
          />
        </div>
        <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-4 text-sm sm:grid-cols-3", edge)}>
          <div className="col-span-2 sm:col-span-1">
            <dt className={inkMuted}>活動期間</dt>
            <dd className="whitespace-nowrap tabular-nums">11/7（五）至 11/17（一）</dd>
          </div>
          <div>
            <dt className={inkMuted}>適用範圍</dt>
            <dd>全館，部分品牌除外</dd>
          </div>
          <div>
            <dt className={inkMuted}>贈品兌換</dt>
            <dd>一樓服務台</dd>
          </div>
        </dl>
      </div>

      {/* 直排：櫥窗直式海報 */}
      <div className={cn("flex flex-row-reverse justify-center gap-5 rounded-md border px-8 py-8", paper, edge)}>
        <CjkHeading
          as="h3"
          vertical
          text="秋季美妝，滿3000送300。"
          highlight={["送300"]}
          className="h-[22rem] text-4xl"
        />
        <CjkHeading
          as="p"
          vertical
          text={"限時三日\n11月7日至9日"}
          className={cn("h-[22rem] text-base font-medium tracking-[0.2em]", inkMuted)}
        />
      </div>
    </section>
  );
}
