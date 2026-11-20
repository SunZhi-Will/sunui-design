"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { NotificationBell, type NotificationItem } from "./notification-bell";

const now = Date.now();

const copy = {
  en: {
    store: "Field Goods",
    labels: { button: "Notifications", markAll: "Mark all as read", unread: "Unread", count: (n: number) => `${n} unread` },
    items: ["Order #1042 has shipped and arrives Thursday.", "Mina replied to your review.", "The Linen tote is back in stock."],
  },
  "zh-TW": {
    store: "田野選物",
    labels: { button: "通知", markAll: "全部標為已讀", unread: "未讀", count: (n: number) => `${n} 則未讀` },
    items: ["訂單 #1042 已出貨，預計週四送達。", "Mina 回覆了你的評論。", "亞麻托特包重新到貨。"],
  },
  "zh-CN": {
    store: "田野选物",
    labels: { button: "通知", markAll: "全部标为已读", unread: "未读", count: (n: number) => `${n} 条未读` },
    items: ["订单 #1042 已发货，预计周四送达。", "Mina 回复了你的评价。", "亚麻托特包已补货。"],
  },
  ja: {
    store: "フィールドグッズ",
    labels: { button: "お知らせ", markAll: "すべて既読にする", unread: "未読", count: (n: number) => `未読 ${n} 件` },
    items: ["ご注文 #1042 を発送しました。", "Mina さんがレビューに返信しました。", "リネントートが再入荷しました。"],
  },
};

/** Catalog card: a compact store header with the notification panel open, two unread and one read. */
export default function NotificationBellCard() {
  const t = useDemoText(copy);
  const locale = useDemoLocale();
  const [read, setRead] = useState<string[]>(["n3"]);
  const actors = [{ name: "Field Goods" }, { name: "Mina Park" }, undefined];
  const ages = [6, 48, 60 * 26];
  const items: NotificationItem[] = t.items.map((text, i) => {
    const id = `n${i + 1}`;
    return { id, text, actor: actors[i], time: now - ages[i] * 60_000, read: read.includes(id) };
  });

  return (
    <div className="relative h-[320px] w-[24rem] overflow-hidden rounded-xl bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <header className="flex items-center justify-between border-b border-foreground/10 py-2 pl-4 pr-3">
        <span className="font-semibold tracking-tight">{t.store}</span>
        <NotificationBell
          defaultOpen
          locale={locale}
          labels={t.labels}
          notifications={items}
          onItemClick={(item) => setRead((r) => [...r, item.id])}
          onMarkAllRead={() => setRead(items.map((n) => n.id))}
        />
      </header>
      <div aria-hidden="true" className="grid grid-cols-3 gap-3 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[4/5] rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
