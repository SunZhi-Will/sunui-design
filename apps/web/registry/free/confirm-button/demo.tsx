"use client";

import { useState } from "react";

import { ConfirmButton } from "./confirm-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Address = { id: string; name: string; lines: string; isDefault?: boolean };

const initial: Address[] = [
  { id: "home", name: "Home", lines: "12 Harbor Lane, Apt 4B, Portland, OR 97209", isDefault: true },
  { id: "office", name: "Office", lines: "400 Market Street, Floor 7, Portland, OR 97204" },
  { id: "parents", name: "Mom and Dad", lines: "88 Cedar Road, Eugene, OR 97401" },
];

export default function ConfirmButtonDemo() {
  const [addresses, setAddresses] = useState(initial);

  return (
    <div className="w-full max-w-xl space-y-6">
      <section aria-labelledby="addresses-heading" className="space-y-3">
        <div>
          <h2 id="addresses-heading" className="text-lg font-semibold tracking-tight">
            Saved addresses
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Press Remove twice to delete. Your default address can't be removed.</p>
        </div>
        <ul className="divide-y divide-border rounded-md border border-border bg-card text-card-foreground">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {a.name}
                  {a.isDefault && (
                    <span className="rounded-[3px] border border-border px-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Default
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{a.lines}</p>
              </div>
              <ConfirmButton
                armedLabel="Press again to remove"
                doneLabel="Removed"
                disabled={a.isDefault}
                onConfirm={async () => {
                  await wait(500);
                  setAddresses((list) => list.filter((x) => x.id !== a.id));
                }}
              >
                Remove
              </ConfirmButton>
            </li>
          ))}
          {!addresses.length && <li className="p-6 text-center text-sm text-muted-foreground">No saved addresses.</li>}
        </ul>
      </section>

      <section aria-labelledby="order-heading" className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="order-heading" className="text-sm font-medium">
              Order <span className="font-mono tracking-[0.12em]">SU-48213</span>
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Placed today, 2 items, not shipped yet</p>
          </div>
          <span className="text-base font-semibold tracking-tight tabular-nums">$128.00</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">You can cancel until it ships. Refunds go back to your card.</p>
          <ConfirmButton
            tone="danger"
            window={3000}
            doneDuration={Infinity}
            armedLabel="Press again to cancel order"
            doneLabel="Order cancelled"
            onConfirm={() => wait(700)}
          >
            Cancel order
          </ConfirmButton>
        </div>
      </section>
    </div>
  );
}
