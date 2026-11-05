"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AnnouncementStrip } from "./announcement-strip";

const copy = {
  en: {
    shipping: "Free shipping on orders over $60 until Sunday.",
    details: "Details",
    returns: "Holiday returns: anything bought from Nov 1 can be returned until Jan 15.",
    store: "Our Taipei store opens late on Fridays, until 10 PM.",
    findStore: "Find a store",
    brand: "Field Supply",
    nav: "Main",
    links: ["New", "Knitwear", "Home", "Sale"],
    eyebrow: "New this week",
    headline: "Wool overshirts, back in four colours",
  },
  "zh-TW": {
    shipping: "週日前訂單滿 $60 免運費。",
    details: "詳情",
    returns: "節慶退貨：11 月 1 日起購買的商品，可在 1 月 15 日前退貨。",
    store: "台北門市週五延長營業至晚上 10 點。",
    findStore: "查詢門市",
    brand: "Field Supply",
    nav: "主選單",
    links: ["新品", "針織", "居家", "特價"],
    eyebrow: "本週新品",
    headline: "羊毛襯衫外套，四色重新到貨",
  },
  "zh-CN": {
    shipping: "周日前订单满 $60 包邮。",
    details: "详情",
    returns: "节日退货：11 月 1 日起购买的商品，可在 1 月 15 日前退货。",
    store: "台北门店周五延长营业至晚上 10 点。",
    findStore: "查找门店",
    brand: "Field Supply",
    nav: "主菜单",
    links: ["新品", "针织", "家居", "特价"],
    eyebrow: "本周新品",
    headline: "羊毛衬衫外套，四色重新到货",
  },
  ja: {
    shipping: "日曜日まで、$60 以上のご注文で送料無料。",
    details: "詳細",
    returns: "ホリデー返品：11月1日以降のご購入品は1月15日まで返品できます。",
    store: "台北店は金曜日、夜10時まで営業しています。",
    findStore: "店舗を探す",
    brand: "Field Supply",
    nav: "メイン",
    links: ["新着", "ニット", "ホーム", "セール"],
    eyebrow: "今週の新着",
    headline: "ウールのシャツジャケット、4色で再入荷",
  },
};

export default function AnnouncementStripDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-[52rem] overflow-hidden rounded-lg border bg-background">
      <AnnouncementStrip
        locale={locale}
        messages={[
          { id: "shipping", content: t.shipping, href: "#shipping", linkLabel: t.details },
          { id: "returns", content: t.returns },
          { id: "store", content: t.store, href: "#stores", linkLabel: t.findStore },
        ]}
      />
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="text-base font-semibold tracking-tight">{t.brand}</span>
        <nav aria-label={t.nav} className="flex gap-4 text-sm text-muted-foreground">
          <a href="#new" className="hover:text-foreground">{t.links[0]}</a>
          <a href="#knitwear" className="hover:text-foreground">{t.links[1]}</a>
          <a href="#home" className="hidden hover:text-foreground sm:inline">{t.links[2]}</a>
          <a href="#sale" className="hover:text-foreground">{t.links[3]}</a>
        </nav>
      </header>
      <div className="border-t px-5 py-8">
        <p className="text-xs text-muted-foreground">{t.eyebrow}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{t.headline}</p>
      </div>
    </div>
  );
}
