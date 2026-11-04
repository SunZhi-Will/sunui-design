"use client";

import { SettlementReceipt, type SettlementPerson } from "./settlement-receipt";

const dinner: SettlementPerson[] = [
  { id: "amy", name: "Amy", paid: true, lines: [{ label: "Beef noodles", amount: 18 }, { label: "Iced tea", amount: 4 }] },
  { id: "ben", name: "Ben", lines: [{ label: "Fried rice", amount: 15 }, { label: "Dumplings", amount: 9 }] },
  { id: "chloe", name: "Chloe", lines: [{ label: "Wonton soup", amount: 12 }, { label: "Dumplings", amount: 9 }] },
  { id: "dev", name: "Dev", lines: [{ label: "Mapo tofu", amount: 16 }, { label: "Rice", amount: 2 }, { label: "Beer", amount: 7 }] },
];

const coffee: SettlementPerson[] = [
  { id: "mia", name: "Mia", paid: true, lines: [{ label: "Flat white", amount: 5.5 }] },
  { id: "leo", name: "Leo", lines: [{ label: "Latte", amount: 5 }, { label: "Croissant", amount: 4 }] },
];

export default function SettlementReceiptDemo() {
  return (
    <section aria-labelledby="split-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="split-heading" className="text-xl font-semibold tracking-tight">
          Your splits
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Tick each transfer once it is sent. The receipt is stamped when everyone is square.</p>
      </div>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <SettlementReceipt
          title="Friday dinner"
          date="Nov 1, 2026"
          receiptNo="SPL-0418"
          people={dinner}
          total={92}
          transfers={[
            { from: "ben", to: "amy", amount: 24 },
            { from: "chloe", to: "amy", amount: 21 },
            { from: "dev", to: "amy", amount: 25 },
          ]}
        />
        <SettlementReceipt
          title="Coffee run"
          date="Oct 30, 2026"
          receiptNo="SPL-0412"
          people={coffee}
          total={14.5}
          transfers={[{ from: "leo", to: "mia", amount: 9 }]}
          defaultSettled
        />
      </div>
    </section>
  );
}
