"use client";

import { useState } from "react";

import { DotBadge, DotNote, PersonChip, type DotTone } from "./dot-badge";

const staff = [
  { id: "u-mia", name: "Mia Chen" },
  { id: "u-leo", name: "Leo Park" },
  { id: "u-xm", name: "林小明" },
  { id: "u-sam", name: "Sam Ortiz" },
];

type Status = { label: string; tone: DotTone; hint?: string };

const statuses: Record<string, Status> = {
  paid: { label: "Paid", tone: "info", hint: "waiting to be packed" },
  packing: { label: "Packing", tone: "live", hint: "in progress now" },
  shipped: { label: "Shipped", tone: "success" },
  refund: { label: "Refund requested", tone: "warning", hint: "needs review" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const orders = [
  { id: "SU-48213", customer: "Ava Brooks", items: 3, status: "packing", packer: "u-xm" },
  { id: "SU-48210", customer: "Noah Kim", items: 1, status: "paid", packer: "u-mia" },
  { id: "SU-48204", customer: "陳怡君", items: 2, status: "shipped", packer: "u-leo" },
  { id: "SU-48199", customer: "Liam Patel", items: 5, status: "refund", packer: "u-mia" },
  { id: "SU-48192", customer: "Emma Rossi", items: 1, status: "cancelled", packer: "u-sam" },
  { id: "SU-48188", customer: "Ethan Wu", items: 4, status: "shipped", packer: "u-xm" },
];

export default function DotBadgeDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)));

  const shown = selected.length ? orders.filter((o) => selected.includes(o.packer)) : orders;
  const byId = Object.fromEntries(staff.map((p) => [p.id, p]));

  return (
    <section aria-labelledby="fulfil-heading" className="w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="fulfil-heading" className="text-xl font-semibold tracking-tight">
            Fulfilment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Today&apos;s orders and who is packing them.</p>
        </div>
        <DotNote tone="live">Warehouse open</DotNote>
      </div>

      <div role="group" aria-label="Filter by packer" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted-foreground">Packed by</span>
        {staff.map((p) => (
          <PersonChip
            key={p.id}
            id={p.id}
            name={p.name}
            size="sm"
            pressed={selected.includes(p.id)}
            onPressedChange={(on) => toggle(p.id, on)}
          />
        ))}
        <PersonChip id="u-temp" name="Temp staff" size="sm" locked pressed={false} />
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
        <div className="hidden grid-cols-[1fr_1.2fr_4rem_9rem_8rem] gap-3 border-b border-border px-4 py-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase sm:grid">
          <span>Order</span>
          <span>Customer</span>
          <span className="text-right">Items</span>
          <span>Status</span>
          <span>Packer</span>
        </div>
        <ul className="divide-y divide-border">
          {shown.map((o) => {
            const st = statuses[o.status];
            const packer = byId[o.packer];
            return (
              <li
                key={o.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3 text-sm sm:grid-cols-[1fr_1.2fr_4rem_9rem_8rem]"
              >
                <span className="font-mono text-xs tracking-[0.12em]">{o.id}</span>
                <span className="truncate text-right sm:text-left">{o.customer}</span>
                <span className="hidden text-right tabular-nums text-muted-foreground sm:block">{o.items}</span>
                <span>
                  <DotBadge tone={st.tone} hint={st.hint}>
                    {st.label}
                  </DotBadge>
                </span>
                <span className="justify-self-end sm:justify-self-start">
                  <PersonChip id={packer.id} name={packer.name} size="sm" muted={o.status === "cancelled"} />
                </span>
              </li>
            );
          })}
        </ul>
        {!shown.length && <p className="p-6 text-center text-sm text-muted-foreground">No orders for this packer today.</p>}
      </div>
    </section>
  );
}
