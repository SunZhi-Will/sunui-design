"use client";

import { PhoneFrame } from "./phone-frame";

const cart = [
  ["Stoneware Mug", "$36.00"],
  ["Canvas Tote", "$24.00"],
];

export default function PhoneFrameDemo() {
  return (
    <PhoneFrame
      url="shop.example.com/cart"
      width={260}
      height={420}
      label="Buyer's phone"
      className="mx-auto"
    >
      <div className="space-y-3 p-4 text-sm">
        <p className="font-semibold">Cart</p>
        {cart.map(([name, price]) => (
          <div key={name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-9 shrink-0 rounded-lg bg-[var(--wf-sunken)]"
            />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="tabular-nums">{price}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[var(--wf-line)] pt-2 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">$60.00</span>
        </div>
        <span className="block rounded-xl bg-[var(--wf-fg)] py-2.5 text-center font-semibold text-[var(--wf-surface)]">
          Pay $60.00
        </span>
      </div>
    </PhoneFrame>
  );
}
