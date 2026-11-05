"use client";

import { useDemoText } from "@/lib/demo-locale";

import { LikeBurst, SendPlaneButton, SuccessCheck, ToggleSwitch } from "./micro-interactions";

const copy = {
  en: { like: "Like", paid: "Paid", updates: "Updates", send: "Send", sent: "Sent" },
  "zh-TW": { like: "喜歡", paid: "已付款", updates: "通知", send: "送出", sent: "已送出" },
  "zh-CN": { like: "喜欢", paid: "已付款", updates: "通知", send: "发送", sent: "已发送" },
  ja: { like: "いいね", paid: "支払い済み", updates: "通知", send: "送信", sent: "送信済み" },
};

/** 型錄卡片：四個可以直接按的微互動。 */
export default function MicroInteractionsCard() {
  const t = useDemoText(copy);
  return (
    <div className="mx-auto grid w-72 grid-cols-2 gap-2">
      <div className="grid h-24 place-items-center rounded-md border border-border bg-card">
        <LikeBurst label={t.like} defaultLiked />
      </div>
      <div className="grid h-24 place-items-center rounded-md border border-border bg-card">
        <SuccessCheck message={t.paid} size={40} />
      </div>
      <div className="grid h-24 place-items-center rounded-md border border-border bg-card">
        <ToggleSwitch label={t.updates} defaultChecked showLabel={false} />
      </div>
      <div className="grid h-24 place-items-center rounded-md border border-border bg-card">
        <SendPlaneButton label={t.send} sentLabel={t.sent} className="min-w-0 px-4" />
      </div>
    </div>
  );
}
