"use client";

import { ShippingOptions } from "./shipping-options";

export default function ShippingOptionsDemo() {
  return (
    <section aria-labelledby="ship-heading" className="w-full max-w-[52rem] space-y-4">
      <div>
        <h2 id="ship-heading" className="text-xl font-semibold tracking-tight">
          Delivery
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Orders placed before 2 PM ship the same day.</p>
      </div>
      <ShippingOptions
        label="Delivery method"
        defaultValue="standard"
        options={[
          { id: "standard", name: "Standard", eta: "Mon, Nov 10", fee: 0, note: "Orders over $50" },
          { id: "express", name: "Express", eta: "Fri, Nov 7", fee: 9.9, note: "Tracked, signature on arrival" },
          { id: "pickup", name: "Store pickup", eta: "Today after 5 PM", fee: 0, note: "Market St. store" },
          { id: "same-day", name: "Same day", eta: "Unavailable for your area", fee: 15, disabled: true },
        ]}
      />
    </section>
  );
}
