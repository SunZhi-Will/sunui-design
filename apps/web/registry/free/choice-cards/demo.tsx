"use client";

import { useState } from "react";

import { ChoiceCards, type ChoiceOption } from "./choice-cards";

const options: (ChoiceOption & { fee: number })[] = [
  {
    id: "standard",
    fee: 4.9,
    name: "Standard",
    brief: "$4.90 · 3 to 5 business days",
    gains: ["Free returns within 30 days"],
    costs: ["Packed in a plastic mailer"],
    includes: [{ term: "Tracking", desc: "Email updates at each scan" }],
    meaning: "Your order ships with the regular courier. Returns stay free.",
  },
  {
    id: "eco",
    fee: 0,
    name: "Eco bundle",
    brief: "Free · ships Friday",
    recommended: true,
    gains: ["Free shipping", "Paper packaging, no plastic"],
    costs: ["Waits for the weekly batch"],
    includes: [
      { term: "Tracking", desc: "One update when it ships" },
      { term: "Bundling", desc: "Joins anything you order before Friday" },
    ],
    meaning: "We hold your order until Friday and ship it with others to your area in one trip.",
  },
  {
    id: "express",
    fee: 14,
    name: "Express",
    brief: "$14.00 · next business day",
    gains: ["Arrives tomorrow if ordered by 3 PM"],
    costs: ["Returns cost $6", "Signature required"],
    includes: [{ term: "Insurance", desc: "Covered up to $500" }],
    meaning: "Picked and packed today. Someone needs to sign for it at the door.",
  },
  {
    id: "same-day",
    fee: 22,
    name: "Same day",
    brief: "$22.00 · by 9 PM tonight",
    gains: ["Delivered by bike courier"],
    disabled: true,
    reason: "Not available for your address yet.",
  },
];

const subtotal = 86;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function ChoiceCardsDemo() {
  const [delivery, setDelivery] = useState("eco");
  const fee = options.find((o) => o.id === delivery)?.fee ?? 0;

  return (
    <section aria-labelledby="delivery-heading" className="w-full max-w-[44rem] space-y-4">
      <div>
        <h2 id="delivery-heading" className="text-xl font-semibold tracking-tight">
          Delivery
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick how your order gets to you. You can change it until it ships.</p>
      </div>

      <ChoiceCards label="Delivery method" options={options} value={delivery} onValueChange={setDelivery} />

      <dl className="grid grid-cols-[1fr_auto] gap-y-1 border-t border-border pt-3 text-sm tabular-nums">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd>{money(subtotal)}</dd>
        <dt className="text-muted-foreground">Delivery</dt>
        <dd>{fee ? money(fee) : "Free"}</dd>
        <dt className="font-medium">Total</dt>
        <dd className="font-semibold">{money(subtotal + fee)}</dd>
      </dl>
    </section>
  );
}
