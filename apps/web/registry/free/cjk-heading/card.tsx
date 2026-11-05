"use client";

import { cn } from "@/lib/utils";

import { CjkHeading } from "./cjk-heading";

/** 型錄卡片：一張中英混排的活動標題，看標點擠壓、自動細空格與朱紅印章關鍵字。 */
export default function CjkHeadingCard() {
  return (
    <div lang="zh-Hant" className={cn("mx-auto w-72 space-y-3 rounded-md border p-5", "border-[#e7e0d0] bg-[#faf7f0] dark:border-[#38332b] dark:bg-[#1f1c18]")}>
      <CjkHeading as="h2" text={"「週年慶」滿千送百，\n會員再享9折。"} highlight={["滿千送百"]} className="text-2xl" />
      <CjkHeading as="p" text={"11月7日起，\nApp獨享加碼5%回饋。"} highlight={["5%回饋"]} className="text-base font-semibold" />
    </div>
  );
}
