"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { BrowserFrame, Stage } from "./browser-frame";

const copy = {
  en: { title: "Orders", badge: "Simulated", names: ["Mia Chen", "Leo Park", "Ana Ruiz"] },
  "zh-TW": { title: "訂單", badge: "模擬", names: ["陳美玲", "林立言", "王安娜"] },
  "zh-CN": { title: "订单", badge: "模拟", names: ["陈美玲", "林立言", "王安娜"] },
  ja: { title: "注文", badge: "シミュレーション", names: ["佐藤 美緒", "鈴木 蓮", "高橋 杏奈"] },
};

const orders = [
  ["SU-20481", "$128.00"],
  ["SU-20480", "$64.50"],
  ["SU-20479", "$219.00"],
];

/** 型錄卡片：點點底紋展示區裡的一個瀏覽器外框，網址列、分頁標題和模擬標記都在，內容是後台訂單表。 */
export default function BrowserFrameCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <Stage className="mx-auto w-80 p-4">
      <BrowserFrame url="shop.example.com/admin/orders" title={t.title} badge={t.badge} locale={locale}>
        <div className="divide-y divide-[var(--wf-line)] text-sm">
          {orders.map(([id, total], i) => (
            <div key={id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="font-mono text-xs text-[var(--wf-fg-muted)]">{id}</span>
              <span className="min-w-0 flex-1 truncate">{t.names[i]}</span>
              <span className="tabular-nums">{total}</span>
            </div>
          ))}
        </div>
      </BrowserFrame>
    </Stage>
  );
}
