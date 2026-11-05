"use client";

import { useEffect, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { NotifyBadge } from "./notify-badge";

const copy = {
  en: { store: "Field Goods", bell: "Notifications", cart: "Cart", msgs: "Messages", notif: (n: number) => `${n} new notifications`, items: (n: number) => `${n} items in cart`, unread: (n: number) => `${n} unread messages`, add: "Add to cart", clear: "Mark all read" },
  "zh-TW": { store: "田野選物", bell: "通知", cart: "購物車", msgs: "訊息", notif: (n: number) => `${n} 則新通知`, items: (n: number) => `購物車有 ${n} 件商品`, unread: (n: number) => `${n} 則未讀訊息`, add: "加入購物車", clear: "全部標為已讀" },
  "zh-CN": { store: "田野选物", bell: "通知", cart: "购物车", msgs: "消息", notif: (n: number) => `${n} 条新通知`, items: (n: number) => `购物车有 ${n} 件商品`, unread: (n: number) => `${n} 条未读消息`, add: "加入购物车", clear: "全部标为已读" },
  ja: { store: "フィールドグッズ", bell: "お知らせ", cart: "カート", msgs: "メッセージ", notif: (n: number) => `新着通知 ${n} 件`, items: (n: number) => `カートに ${n} 点`, unread: (n: number) => `未読メッセージ ${n} 件`, add: "カートに入れる", clear: "すべて既読にする" },
};

const iconClass = "size-5";
const Bell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden="true">
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2 2 0 0 0 4 0" />
  </svg>
);
const Bag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden="true">
    <path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
const Chat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden="true">
    <path d="M4 5h16v11H9l-5 4V5z" />
  </svg>
);

export default function NotifyBadgeDemo() {
  const t = useDemoText(copy);
  const [notes, setNotes] = useState(2);
  const [cart, setCart] = useState(1);

  // 模擬通知陸續進來：前 3 則每 2.5 秒一則，之後停住
  useEffect(() => {
    if (notes >= 5) return;
    const id = setTimeout(() => setNotes((n) => n + 1), 2500);
    return () => clearTimeout(id);
  }, [notes]);

  const iconButton = "grid size-10 place-items-center rounded-md text-foreground hover:bg-muted";
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-lg border bg-background">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <span className="font-semibold tracking-tight">{t.store}</span>
        <nav className="flex items-center gap-1">
          <button type="button" className={iconButton} aria-label={t.msgs}>
            <NotifyBadge dot count={1} tone="ink" label={t.unread}>
              <Chat />
            </NotifyBadge>
          </button>
          <button type="button" className={iconButton} aria-label={t.bell} onClick={() => setNotes(0)}>
            <NotifyBadge count={notes} label={t.notif}>
              <Bell />
            </NotifyBadge>
          </button>
          <button type="button" className={iconButton} aria-label={t.cart}>
            <NotifyBadge count={cart} tone="primary" max={9} label={t.items}>
              <Bag />
            </NotifyBadge>
          </button>
        </nav>
      </header>
      <div className="flex flex-wrap items-center gap-3 p-5">
        <div aria-hidden="true" className="size-16 rounded-md bg-muted" />
        <button type="button" onClick={() => setCart((c) => c + 1)} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          {t.add}
        </button>
        <button type="button" onClick={() => setNotes(0)} className="h-10 rounded-md border px-4 text-sm">
          {t.clear}
        </button>
      </div>
    </div>
  );
}
