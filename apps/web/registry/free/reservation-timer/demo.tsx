"use client";

import { useState } from "react";

import { ReservationTimer } from "./reservation-timer";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Line({ name, meta, price }: { name: string; meta: string; price: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-xs opacity-60">{meta}</p>
      </div>
      <span className="shrink-0 font-medium tabular-nums">{price}</span>
    </div>
  );
}

export default function ReservationTimerDemo() {
  // 到期時間在初始化時算一次
  const [dates] = useState(() => ({
    ticket: Date.now() + (9 * 60 + 40) * 1000,
    past: Date.now() - 60_000,
  }));
  const [drop, setDrop] = useState(() => Date.now() + 45_000);

  return (
    <aside aria-labelledby="held-heading" className="w-full max-w-[52rem] space-y-4">
      <div>
        <h2 id="held-heading" className="text-xl font-semibold tracking-tight">
          Your holds
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Limited items are held while you check out, then released to the next shopper.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ReservationTimer expiresAt={dates.ticket} holdSeconds={600}>
          <Line name="Studio Session, Sat 2 PM" meta="1 seat, Row B" price="$48.00" />
        </ReservationTimer>
        <ReservationTimer
          title="Limited drop"
          expiresAt={drop}
          holdSeconds={600}
          onRenew={async () => {
            await wait(600);
            setDrop(Date.now() + 600_000);
          }}
        >
          <Line name="Indigo Selvedge Jacket" meta="Size M, 3 left" price="$220.00" />
        </ReservationTimer>
        <ReservationTimer expiresAt={dates.past} holdSeconds={600}>
          <Line name="Glaze Workshop Kit" meta="Qty 1" price="$36.00" />
        </ReservationTimer>
      </div>
    </aside>
  );
}
