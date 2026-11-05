"use client";

import { ShippingOptions } from "./shipping-options";

/** 型錄卡片：兩張票根式配送選項，點選或用方向鍵切換。 */
export default function ShippingOptionsCard() {
  return (
    <div className="mx-auto w-72">
      <ShippingOptions
        label="Delivery method"
        defaultValue="standard"
        options={[
          { id: "standard", name: "Standard", eta: "Mon, Nov 10", fee: 0, note: "Orders over $50" },
          { id: "express", name: "Express", eta: "Fri, Nov 7", fee: 9.9, note: "Tracked delivery" },
        ]}
      />
    </div>
  );
}
