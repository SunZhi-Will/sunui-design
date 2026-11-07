"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CookieConsent } from "./cookie-consent";

const copy = {
  en: {
    body: "Necessary cookies keep the cart working. The rest is your call.",
    headline: "Knitwear for the first cold week",
    categories: [
      { id: "necessary", label: "Necessary", description: "Cart, checkout and sign-in.", required: true },
      { id: "analytics", label: "Analytics", description: "Anonymous visit counts." },
      { id: "marketing", label: "Marketing", description: "Ads on other sites." },
    ],
  },
  "zh-TW": {
    body: "必要 Cookie 讓購物車能運作，其他由你決定。",
    headline: "第一波寒流的針織衫",
    categories: [
      { id: "necessary", label: "必要", description: "購物車、結帳與登入。", required: true },
      { id: "analytics", label: "分析", description: "匿名的瀏覽統計。" },
      { id: "marketing", label: "行銷", description: "在其他網站顯示廣告。" },
    ],
  },
  "zh-CN": {
    body: "必要 Cookie 让购物车正常运作，其他由你决定。",
    headline: "第一波寒潮的针织衫",
    categories: [
      { id: "necessary", label: "必要", description: "购物车、结账和登录。", required: true },
      { id: "analytics", label: "分析", description: "匿名的访问统计。" },
      { id: "marketing", label: "营销", description: "在其他网站展示广告。" },
    ],
  },
  ja: {
    body: "必須 Cookie はカートのために使います。ほかはお任せします。",
    headline: "最初の寒い週のためのニット",
    categories: [
      { id: "necessary", label: "必須", description: "カート、決済、ログイン。", required: true },
      { id: "analytics", label: "分析", description: "匿名のアクセス集計。" },
      { id: "marketing", label: "マーケティング", description: "他サイトでの広告。" },
    ],
  },
};

/** 型錄卡片：手機寬的商店頁面底部浮出 Cookie 同意條，可全部接受、拒絕或展開逐項開關。 */
export default function CookieConsentCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 選完之後同意條會收起，過一下換 key 讓卡片回到初始狀態
  const [round, setRound] = useState(0);

  return (
    <div className="relative mx-auto h-[360px] w-[400px] overflow-hidden rounded-lg border bg-background">
      <div className="px-4 py-4">
        <p className="text-base font-semibold tracking-tight">{t.headline}</p>
        <div aria-hidden="true" className="mt-3 grid grid-cols-3 gap-2">
          <div className="aspect-[4/5] rounded-md bg-muted" />
          <div className="aspect-[4/5] rounded-md bg-muted" />
          <div className="aspect-[4/5] rounded-md bg-muted" />
        </div>
      </div>
      <CookieConsent
        key={round}
        locale={locale}
        position="contained"
        policyHref="#cookies"
        categories={t.categories}
        labels={{ body: t.body }}
        onChange={() => setTimeout(() => setRound((r) => r + 1), 1600)}
      />
    </div>
  );
}
