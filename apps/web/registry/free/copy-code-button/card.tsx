"use client";

import { ProductArt, productNames } from "@/registry/_demo/product-art";

import { CopyCodeButton } from "./copy-code-button";

/** 型錄卡片：一件商品配一張折扣碼，點一下看複製後蓋章的那一下。 */
export default function CopyCodeButtonCard() {
  return (
    <div className="mx-auto flex w-64 flex-col gap-3 rounded-md border border-border bg-card p-3 text-card-foreground">
      <div className="flex items-center gap-3">
        <ProductArt kind="tote" className="size-16 shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{productNames.tote}</p>
          <p className="text-sm tabular-nums">$48.00</p>
        </div>
      </div>
      <p className="text-sm">Extra 20% off your first order:</p>
      <CopyCodeButton code="SUNNY20" caption="20% off" size="lg" />
    </div>
  );
}
