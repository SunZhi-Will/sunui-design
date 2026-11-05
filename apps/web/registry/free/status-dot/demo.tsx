"use client";

import { useDemoText } from "@/lib/demo-locale";

import { StatusDot, type StatusTone } from "./status-dot";

const orders: { id: string; customer: string; tone: StatusTone }[] = [
  { id: "#1042", customer: "Hana Ito", tone: "success" },
  { id: "#1043", customer: "Marco Silva", tone: "info" },
  { id: "#1044", customer: "王大同", tone: "warning" },
  { id: "#1045", customer: "Ava Chen", tone: "destructive" },
  { id: "#1046", customer: "Noah Park", tone: "muted" },
];

const statusText = {
  en: { success: "Delivered", info: "Shipped", warning: "Awaiting payment", destructive: "Payment failed", muted: "Cancelled" },
  "zh-TW": { success: "已送達", info: "已出貨", warning: "等待付款", destructive: "付款失敗", muted: "已取消" },
  "zh-CN": { success: "已送达", info: "已发货", warning: "待付款", destructive: "支付失败", muted: "已取消" },
  ja: { success: "配達済み", info: "発送済み", warning: "入金待ち", destructive: "決済失敗", muted: "キャンセル" },
} satisfies Record<string, Record<StatusTone, string>>;

export default function StatusDotDemo() {
  const label = useDemoText(statusText);
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
      <ul className="flex flex-col divide-y divide-border">
        {orders.map((o) => (
          <li key={o.id} className="flex min-w-0 items-center justify-between gap-3 py-2.5">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
              <span className="truncate text-sm text-foreground">{o.customer}</span>
            </span>
            <StatusDot tone={o.tone} className="text-xs text-foreground">
              {label[o.tone]}
            </StatusDot>
          </li>
        ))}
      </ul>
    </div>
  );
}
