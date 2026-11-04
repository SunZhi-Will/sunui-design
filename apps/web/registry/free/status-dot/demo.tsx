"use client";

import { StatusDot, type StatusTone } from "./status-dot";

const orders: { id: string; customer: string; tone: StatusTone; label: string }[] = [
  { id: "#1042", customer: "Hana Ito", tone: "success", label: "Delivered" },
  { id: "#1043", customer: "Marco Silva", tone: "info", label: "Shipped" },
  { id: "#1044", customer: "王大同", tone: "warning", label: "Awaiting payment" },
  { id: "#1045", customer: "Ava Chen", tone: "destructive", label: "Payment failed" },
  { id: "#1046", customer: "Noah Park", tone: "muted", label: "Cancelled" },
];

export default function StatusDotDemo() {
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
              {o.label}
            </StatusDot>
          </li>
        ))}
      </ul>
    </div>
  );
}
