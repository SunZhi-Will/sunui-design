"use client";

import { AddonChecklist } from "./addon-checklist";

export default function AddonChecklistDemo() {
  return (
    <section aria-labelledby="addon-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="addon-heading" className="text-xl font-semibold tracking-tight">
          Finish your order
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick the extras you want. The subtotal updates as you go.</p>
      </div>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <AddonChecklist
          title="Linen Throw Blanket"
          basePrice={68}
          defaultValue={["wrap"]}
          items={[
            { id: "wrap", label: "Gift wrap", note: "Kraft paper and cotton twine", price: 4 },
            { id: "card", label: "Handwritten card", price: 0 },
            { id: "care", label: "Care kit", note: "Linen wash and mesh bag", price: 12 },
            { id: "warranty", label: "2-year cover", price: 9.5 },
          ]}
        />
        <AddonChecklist
          title="Studio Session"
          basePrice={48}
          items={[
            { id: "booking", label: "Booking fee", price: 2, required: true },
            { id: "prints", label: "Printed photos", note: "Set of 6, 4 x 6 in", price: 15 },
            { id: "parking", label: "Parking pass", price: 6 },
          ]}
        />
      </div>
    </section>
  );
}
