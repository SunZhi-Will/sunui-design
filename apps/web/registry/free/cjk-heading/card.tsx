"use client";

import { cn } from "@/lib/utils";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CjkHeading } from "./cjk-heading";

// 英文介面沿用繁中範例：這個 block 專為中日文標題而做
const zhTW = { lang: "zh-Hant", title: "「週年慶」滿千送百，\n會員再享9折。", titleSeal: "滿千送百", sub: "11月7日起，\nApp獨享加碼5%回饋。", subSeal: "5%回饋" };
const copy = {
  en: zhTW,
  "zh-TW": zhTW,
  "zh-CN": { lang: "zh-Hans", title: "“周年庆”满千送百，\n会员再享9折。", titleSeal: "满千送百", sub: "11月7日起，\nApp独享加码5%返现。", subSeal: "5%返现" },
  ja: { lang: "ja", title: "「周年祭」1万円で千円還元、\n会員はさらに10%オフ。", titleSeal: "千円還元", sub: "11月7日から、\nアプリ限定で5%還元を上乗せ。", subSeal: "5%還元" },
};

/** 型錄卡片：一張中英混排的活動標題，看標點擠壓、自動細空格與朱紅印章關鍵字。 */
export default function CjkHeadingCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div lang={t.lang} className={cn("mx-auto w-72 space-y-3 rounded-md border p-5", "border-[#e2e2e2] bg-[#f7f7f7] dark:border-[#333333] dark:bg-[#1c1c1c]")}>
      <CjkHeading as="h2" locale={locale} text={t.title} highlight={[t.titleSeal]} className="text-2xl" />
      <CjkHeading as="p" locale={locale} text={t.sub} highlight={[t.subSeal]} className="text-base font-semibold" />
    </div>
  );
}
