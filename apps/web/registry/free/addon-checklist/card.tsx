"use client";

import { AddonChecklist } from "./addon-checklist";

/** 型錄卡片：一張加購收據，勾選加購品，小計跟著滾動。 */
export default function AddonChecklistCard() {
  return (
    <div className="mx-auto w-72">
      <AddonChecklist
        title="Linen Throw Blanket"
        basePrice={68}
        defaultValue={["wrap"]}
        items={[
          { id: "wrap", label: "Gift wrap", price: 4 },
          { id: "card", label: "Handwritten card", price: 0 },
          { id: "care", label: "Care kit", price: 12 },
        ]}
        className="min-w-0"
      />
    </div>
  );
}
