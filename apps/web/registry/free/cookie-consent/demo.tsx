"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CookieConsent } from "./cookie-consent";

const copy = {
  en: {
    eyebrow: "Autumn edit",
    headline: "Knitwear for the first cold week",
    categories: [
      { id: "necessary", label: "Necessary", description: "Cart, checkout and sign-in.", required: true },
      { id: "analytics", label: "Analytics", description: "Anonymous visit counts that help us fix slow pages." },
      { id: "marketing", label: "Marketing", description: "Ads for our products on other sites." },
    ],
  },
  "zh-TW": {
    eyebrow: "秋季選品",
    headline: "第一波寒流的針織衫",
    categories: [
      { id: "necessary", label: "必要", description: "購物車、結帳與登入。", required: true },
      { id: "analytics", label: "分析", description: "匿名的瀏覽統計，幫我們找出載入慢的頁面。" },
      { id: "marketing", label: "行銷", description: "在其他網站顯示我們商品的廣告。" },
    ],
  },
  "zh-CN": {
    eyebrow: "秋季选品",
    headline: "第一波寒潮的针织衫",
    categories: [
      { id: "necessary", label: "必要", description: "购物车、结账和登录。", required: true },
      { id: "analytics", label: "分析", description: "匿名的访问统计，帮助我们找出加载慢的页面。" },
      { id: "marketing", label: "营销", description: "在其他网站展示我们商品的广告。" },
    ],
  },
  ja: {
    eyebrow: "秋のセレクト",
    headline: "最初の寒い週のためのニット",
    categories: [
      { id: "necessary", label: "必須", description: "カート、決済、ログイン。", required: true },
      { id: "analytics", label: "分析", description: "遅いページを直すための匿名のアクセス集計。" },
      { id: "marketing", label: "マーケティング", description: "他のサイトでの当店商品の広告。" },
    ],
  },
};

export default function CookieConsentDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="relative h-[30rem] w-full max-w-[52rem] overflow-hidden rounded-lg border bg-background">
      <div className="px-5 py-8">
        <p className="text-xs text-muted-foreground">{t.eyebrow}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{t.headline}</p>
        <div aria-hidden="true" className="mt-6 grid grid-cols-3 gap-3">
          <div className="aspect-[4/5] rounded-md bg-muted" />
          <div className="aspect-[4/5] rounded-md bg-muted" />
          <div className="aspect-[4/5] rounded-md bg-muted" />
        </div>
      </div>
      <CookieConsent locale={locale} position="contained" policyHref="#cookies" categories={t.categories} onChange={() => {}} />
    </div>
  );
}
