"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { NotificationBell, type NotificationItem } from "./notification-bell";

const now = Date.now();

const copy = {
  en: {
    store: "Field Goods",
    nav: ["Shop", "New in", "Journal"],
    bag: "Bag",
    labels: { button: "Notifications", markAll: "Mark all as read", empty: "You're all caught up", unread: "Unread", count: (n: number) => `${n} unread` },
    items: [
      "Order #1042 has shipped and arrives Thursday.",
      "Mina replied to your review of the Merino crew neck.",
      "The Linen tote is back in stock in Sand.",
      "Your return for order #1037 has been refunded.",
    ],
  },
  "zh-TW": {
    store: "田野選物",
    nav: ["商店", "新品", "誌"],
    bag: "購物袋",
    labels: { button: "通知", markAll: "全部標為已讀", empty: "沒有新通知了", unread: "未讀", count: (n: number) => `${n} 則未讀` },
    items: [
      "訂單 #1042 已出貨，預計週四送達。",
      "Mina 回覆了你對美麗諾圓領針織衫的評論。",
      "亞麻托特包「沙色」重新到貨。",
      "訂單 #1037 的退貨已完成退款。",
    ],
  },
  "zh-CN": {
    store: "田野选物",
    nav: ["商店", "新品", "志"],
    bag: "购物袋",
    labels: { button: "通知", markAll: "全部标为已读", empty: "没有新通知了", unread: "未读", count: (n: number) => `${n} 条未读` },
    items: [
      "订单 #1042 已发货，预计周四送达。",
      "Mina 回复了你对美丽诺圆领针织衫的评价。",
      "亚麻托特包「沙色」已补货。",
      "订单 #1037 的退货已完成退款。",
    ],
  },
  ja: {
    store: "フィールドグッズ",
    nav: ["ショップ", "新着", "読みもの"],
    bag: "バッグ",
    labels: { button: "お知らせ", markAll: "すべて既読にする", empty: "新しいお知らせはありません", unread: "未読", count: (n: number) => `未読 ${n} 件` },
    items: [
      "ご注文 #1042 を発送しました。木曜日にお届け予定です。",
      "Mina さんがメリノ クルーネックのレビューに返信しました。",
      "リネントート（サンド）が再入荷しました。",
      "ご注文 #1037 の返品の返金が完了しました。",
    ],
  },
};

const BagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
    <path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

/** 商店 header 裡的通知鈴：面板預設展開，點一則標為已讀，或一次全部已讀。 */
export default function NotificationBellDemo() {
  const t = useDemoText(copy);
  const locale = useDemoLocale();
  // 只有已讀狀態是互動資料，文案跟著語言換
  const [read, setRead] = useState<string[]>(["n4", "n3"]);
  const actors = [{ name: "Field Goods" }, { name: "Mina Park" }, undefined, undefined];
  const ages = [6, 48, 60 * 26, 60 * 24 * 3];
  const items: NotificationItem[] = t.items.map((text, i) => {
    const id = `n${i + 1}`;
    return { id, text, actor: actors[i], time: now - ages[i] * 60_000, read: read.includes(id) };
  });

  return (
    <div className="relative h-[460px] w-full max-w-2xl overflow-hidden rounded-xl bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <header className="flex items-center justify-between gap-4 border-b border-foreground/10 px-5 py-2.5">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-tight">{t.store}</span>
          <nav className="hidden gap-5 text-sm text-muted-foreground sm:flex">
            {t.nav.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell
            defaultOpen
            locale={locale}
            labels={t.labels}
            notifications={items}
            onItemClick={(item) => setRead((r) => [...r, item.id])}
            onMarkAllRead={() => setRead(items.map((n) => n.id))}
          />
          <button
            type="button"
            aria-label={t.bag}
            className="grid size-10 place-items-center rounded-md text-foreground outline-none transition-[background-color,scale] duration-150 hover:bg-muted hover:duration-0 focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]"
          >
            <BagIcon />
          </button>
        </div>
      </header>
      {/* 底下的商品格，讓面板確實浮在內容上 */}
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[4/5] rounded-xl bg-muted" />
            <div className="h-2 w-3/4 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
