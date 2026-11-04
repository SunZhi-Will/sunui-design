"use client";

import { useState } from "react";

import { CheckoutSteps, type CheckoutStep } from "./checkout-steps";

const steps: CheckoutStep[] = [
  { id: "cart", label: "Cart", hint: "3 items" },
  { id: "shipping", label: "Shipping", hint: "Address and method" },
  { id: "payment", label: "Payment", hint: "Card or transfer" },
  { id: "review", label: "Review", hint: "Confirm and pay" },
];

export default function CheckoutStepsDemo() {
  const [atShipping, setAtShipping] = useState(1);
  const [atPayment, setAtPayment] = useState(2);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <header className="rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5">
        <p className="mb-4 text-sm font-semibold tracking-tight">Checkout</p>
        <CheckoutSteps steps={steps} current={atShipping} onStepClick={(i) => setAtShipping(i)} />
      </header>

      <header className="rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5">
        <p className="mb-4 text-sm font-semibold tracking-tight">Checkout</p>
        <CheckoutSteps steps={steps} current={atPayment} onStepClick={(i) => setAtPayment(i)} />
      </header>

      <header className="rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight">Order placed</p>
          <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground">#SU-20481</p>
        </div>
        <CheckoutSteps steps={steps} current={steps.length} />
      </header>
    </div>
  );
}
