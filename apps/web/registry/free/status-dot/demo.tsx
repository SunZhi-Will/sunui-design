"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StatusDot, type StatusShape, type StatusTone } from "./status-dot";

type State = "delivered" | "processing" | "shipped" | "awaiting" | "failed" | "cancelled";

const LOOK: Record<State, { tone: StatusTone; shape: StatusShape; progress?: number; live?: boolean }> = {
  delivered: { tone: "success", shape: "full" },
  shipped: { tone: "info", shape: "half", progress: 0.75 },
  processing: { tone: "info", shape: "half", live: true },
  awaiting: { tone: "warning", shape: "ring" },
  failed: { tone: "destructive", shape: "full" },
  cancelled: { tone: "muted", shape: "slashed" },
};

const MIN = 60_000;
const orders: { id: string; customer: string; state: State; ago: number }[] = [
  { id: "#1042", customer: "Hana Ito", state: "delivered", ago: 26 * 60 * MIN },
  { id: "#1043", customer: "Marco Silva", state: "processing", ago: 40 * MIN },
  { id: "#1044", customer: "王大同", state: "awaiting", ago: 3 * 60 * MIN },
  { id: "#1045", customer: "Ava Chen", state: "failed", ago: 12 * MIN },
  { id: "#1046", customer: "Noah Park", state: "cancelled", ago: 4 * 24 * 60 * MIN },
];

const statusText = {
  en: { delivered: "Delivered", processing: "Processing", shipped: "Shipped", awaiting: "Awaiting payment", failed: "Payment failed", cancelled: "Cancelled" },
  "zh-TW": { delivered: "已送達", processing: "處理中", shipped: "已出貨", awaiting: "等待付款", failed: "付款失敗", cancelled: "已取消" },
  "zh-CN": { delivered: "已送达", processing: "处理中", shipped: "已发货", awaiting: "待付款", failed: "支付失败", cancelled: "已取消" },
  ja: { delivered: "配達済み", processing: "処理中", shipped: "発送済み", awaiting: "入金待ち", failed: "決済失敗", cancelled: "キャンセル" },
} satisfies Record<string, Record<State, string>>;

export default function StatusDotDemo() {
  const locale = useDemoLocale();
  const label = useDemoText(statusText);
  const [now] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);
  // 資料自己更新：倉庫把 #1043 交給物流，接著 #1044 付款進來開始處理
  const [moves, setMoves] = useState<Record<string, { state: State; at: number }>>({});
  const cursor = useDemoAutoplay(ref, async (d) => {
    await d.wait(1600);
    setMoves((m) => ({ ...m, "#1043": { state: "shipped", at: Date.now() } }));
    await d.wait(2200);
    setMoves((m) => ({ ...m, "#1044": { state: "processing", at: Date.now() } }));
  });

  return (
    <div ref={ref} className="relative w-full max-w-md rounded-xl border border-border bg-card p-4">
      <ul className="flex flex-col divide-y divide-border">
        {orders.map((o) => {
          const moved = moves[o.id];
          const state: State = moved ? moved.state : o.state;
          const look = LOOK[state];
          return (
            <li key={o.id} className="flex min-w-0 items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                <span className="truncate text-sm text-foreground">{o.customer}</span>
              </span>
              <StatusDot
                tone={look.tone}
                shape={look.shape}
                progress={look.progress}
                live={look.live}
                since={moved ? moved.at : now - o.ago}
                locale={locale}
                className="shrink-0 text-xs text-foreground"
              >
                {label[state]}
              </StatusDot>
            </li>
          );
        })}
      </ul>
      {cursor}
    </div>
  );
}
