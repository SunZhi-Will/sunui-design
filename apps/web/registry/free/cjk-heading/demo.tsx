"use client";

import { cn } from "@/lib/utils";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CjkHeading } from "./cjk-heading";

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";

// 這個 block 專為中日文標題而做，英文介面沿用繁中範例
const copy = {
  "zh-TW": {
    lang: "zh-Hant",
    eyebrow: "2026 週年慶　全館同步",
    title: "「週年慶」滿千送百，\n會員再享9折。",
    titleSeal: "滿千送百",
    sub: "11月7日起，\nApp獨享加碼5%回饋。",
    subSeal: "5%回饋",
    periodLabel: "活動期間",
    period: "11/7（五）至 11/17（一）",
    scopeLabel: "適用範圍",
    scope: "全館，部分品牌除外",
    giftLabel: "贈品兌換",
    gift: "一樓服務台",
    poster: "秋季美妝，滿3000送300。",
    posterSeal: "送300",
    posterNote: "限時三日\n11月7日至9日",
  },
  "zh-CN": {
    lang: "zh-Hans",
    eyebrow: "2026 周年庆　全场同步",
    title: "“周年庆”满千送百，\n会员再享9折。",
    titleSeal: "满千送百",
    sub: "11月7日起，\nApp独享加码5%返现。",
    subSeal: "5%返现",
    periodLabel: "活动时间",
    period: "11/7（周五）至 11/17（周一）",
    scopeLabel: "适用范围",
    scope: "全场，部分品牌除外",
    giftLabel: "赠品兑换",
    gift: "一楼服务台",
    poster: "秋季美妆，满3000送300。",
    posterSeal: "送300",
    posterNote: "限时三日\n11月7日至9日",
  },
  ja: {
    lang: "ja",
    eyebrow: "2026 周年祭　全館同時開催",
    title: "「周年祭」1万円で千円還元、\n会員はさらに10%オフ。",
    titleSeal: "千円還元",
    sub: "11月7日から、\nアプリ限定で5%還元を上乗せ。",
    subSeal: "5%還元",
    periodLabel: "開催期間",
    period: "11/7（金）〜 11/17（月）",
    scopeLabel: "対象",
    scope: "全館（一部除外）",
    giftLabel: "景品の引き換え",
    gift: "1階サービスカウンター",
    poster: "秋のコスメ、3000円で300円還元。",
    posterSeal: "300円還元",
    posterNote: "三日間限定\n11月7日〜9日",
  },
};

export default function CjkHeadingDemo() {
  const locale = useDemoLocale();
  const t = useDemoText({ en: copy["zh-TW"], ...copy });
  return (
    <section lang={t.lang} className={cn("grid w-full max-w-4xl gap-4 md:grid-cols-[1fr_auto]", ink)}>
      {/* 橫排：活動頁主視覺 */}
      <div className={cn("flex flex-col justify-between gap-8 rounded-md border p-6 sm:p-9", paper, edge)}>
        <div className="space-y-5">
          <p className={cn("text-xs font-medium tracking-[0.2em]", inkMuted)}>{t.eyebrow}</p>
          <CjkHeading
            as="h2"
            locale={locale}
            text={t.title}
            highlight={[t.titleSeal]}
          />
          <CjkHeading
            as="p"
            locale={locale}
            text={t.sub}
            highlight={[t.subSeal]}
            className="text-xl font-semibold sm:text-2xl"
          />
        </div>
        <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-4 text-sm sm:grid-cols-3", edge)}>
          <div className="col-span-2 sm:col-span-1">
            <dt className={inkMuted}>{t.periodLabel}</dt>
            <dd className="whitespace-nowrap tabular-nums">{t.period}</dd>
          </div>
          <div>
            <dt className={inkMuted}>{t.scopeLabel}</dt>
            <dd>{t.scope}</dd>
          </div>
          <div>
            <dt className={inkMuted}>{t.giftLabel}</dt>
            <dd>{t.gift}</dd>
          </div>
        </dl>
      </div>

      {/* 直排：櫥窗直式海報 */}
      <div className={cn("flex flex-row-reverse justify-center gap-5 rounded-md border px-8 py-8", paper, edge)}>
        <CjkHeading
          as="h3"
          vertical
          locale={locale}
          text={t.poster}
          highlight={[t.posterSeal]}
          className="h-[22rem] text-4xl"
        />
        <CjkHeading
          as="p"
          vertical
          locale={locale}
          text={t.posterNote}
          className={cn("h-[22rem] text-base font-medium tracking-[0.2em]", inkMuted)}
        />
      </div>
    </section>
  );
}
