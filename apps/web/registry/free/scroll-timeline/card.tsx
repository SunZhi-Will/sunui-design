"use client";

import { useEffect, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ScrollTimeline } from "./scroll-timeline";

const copy = {
  en: {
    order: "Order #A1042",
    eta: "Arrives Thursday",
    tracking: [
      { id: "placed", time: "Mon 09:12", title: "Order placed" },
      { id: "packed", time: "Mon 15:40", title: "Packed at our studio" },
      { id: "shipped", time: "Tue 08:05", title: "Handed to the courier" },
      { id: "out", time: "", title: "Out for delivery" },
      { id: "delivered", time: "", title: "Delivered" },
    ],
  },
  "zh-TW": {
    order: "訂單 #A1042",
    eta: "預計週四送達",
    tracking: [
      { id: "placed", time: "週一 09:12", title: "已成立訂單" },
      { id: "packed", time: "週一 15:40", title: "工作室已包裝" },
      { id: "shipped", time: "週二 08:05", title: "已交給物流" },
      { id: "out", time: "", title: "配送中" },
      { id: "delivered", time: "", title: "已送達" },
    ],
  },
  "zh-CN": {
    order: "订单 #A1042",
    eta: "预计周四送达",
    tracking: [
      { id: "placed", time: "周一 09:12", title: "订单已提交" },
      { id: "packed", time: "周一 15:40", title: "工作室已打包" },
      { id: "shipped", time: "周二 08:05", title: "已交给快递" },
      { id: "out", time: "", title: "派送中" },
      { id: "delivered", time: "", title: "已签收" },
    ],
  },
  ja: {
    order: "注文 #A1042",
    eta: "木曜日にお届け予定",
    tracking: [
      { id: "placed", time: "月 09:12", title: "ご注文を承りました" },
      { id: "packed", time: "月 15:40", title: "アトリエで梱包しました" },
      { id: "shipped", time: "火 08:05", title: "配送業者に引き渡しました" },
      { id: "out", time: "", title: "配達中" },
      { id: "delivered", time: "", title: "お届け済み" },
    ],
  },
};

// Each beat advances one stop; after reaching the end it holds two extra beats, then starts over
const TICKS = 7;

/** Catalog card: an order-tracking timeline that advances on its own; the line draws all the way down and the dot at each stop presses down like a stamp. */
export default function ScrollTimelineCard() {
  const t = useDemoText(copy);
  const [tick, setTick] = useState(2);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => (n + 1) % TICKS), 1300);
    return () => window.clearInterval(id);
  }, []);
  const current = Math.min(tick, t.tracking.length - 1);

  return (
    <div className="mx-auto w-80 rounded-lg border border-foreground/10 bg-card p-4 text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
      <p className="font-mono text-[11px] tracking-[0.12em] opacity-60">{t.order}</p>
      <p className="mt-0.5 mb-3 text-base font-semibold tracking-tight">{t.eta}</p>
      <ScrollTimeline mode="progress" current={current} items={t.tracking} className="space-y-2 text-sm" />
    </div>
  );
}
