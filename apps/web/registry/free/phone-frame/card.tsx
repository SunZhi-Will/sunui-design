"use client";

import { PhoneFrame } from "./phone-frame";

const cart = [
  ["Stoneware Mug", "$36"],
  ["Canvas Tote", "$24"],
  ["Linen Napkin", "$12"],
  ["Oak Coaster", "$9"],
];

/** 型錄卡片：一支小手機框，螢幕裡的購物車可以上下捲動。 */
export default function PhoneFrameCard() {
  return (
    <PhoneFrame url="shop.example.com" width={150} height={236} className="mx-auto">
      <div className="space-y-2.5 p-3 text-[11px]">
        <p className="font-semibold">Cart</p>
        {cart.map(([name, price]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-6 shrink-0 rounded-md bg-[var(--wf-sunken)]" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="tabular-nums">{price}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[var(--wf-line)] pt-2 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">$81</span>
        </div>
        <span className="block rounded-lg bg-[var(--wf-fg)] py-2 text-center font-semibold text-[var(--wf-surface)]">Pay $81</span>
      </div>
    </PhoneFrame>
  );
}
