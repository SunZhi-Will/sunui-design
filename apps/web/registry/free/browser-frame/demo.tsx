"use client";

import { BrowserFrame } from "./browser-frame";

const orders = [
  ["SU-20481", "Mia Chen", "$128.00"],
  ["SU-20480", "Leo Park", "$64.50"],
  ["SU-20479", "Ana Ruiz", "$219.00"],
];

export default function BrowserFrameDemo() {
  return (
    <BrowserFrame
      url="shop.example.com/admin/orders"
      title="Orders"
      badge="Simulated"
      className="w-full max-w-xl"
    >
      <div className="divide-y divide-[var(--wf-line)] text-sm">
        {orders.map(([id, name, total]) => (
          <div key={id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-mono text-xs text-[var(--wf-fg-muted)]">
              {id}
            </span>
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="tabular-nums">{total}</span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
