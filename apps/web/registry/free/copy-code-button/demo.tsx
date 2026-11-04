"use client";

import { ProductArt, productNames } from "@/registry/_demo/product-art";

import { CopyCodeButton } from "./copy-code-button";

export default function CopyCodeButtonDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-5 rounded-md border border-border bg-card p-4 text-card-foreground sm:grid-cols-[13rem_1fr] sm:p-5">
      <ProductArt kind="tote" className="aspect-[3/2] rounded-md sm:aspect-square" />

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{productNames.tote}</h2>
          <p className="mt-0.5 text-lg tabular-nums">$48.00</p>
          <p className="mt-1 text-sm text-muted-foreground">Heavy canvas, leather handles, inside pocket.</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Extra 20% off your first order, use at checkout:</p>
          <CopyCodeButton code="SUNNY20" caption="20% off" size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>Free shipping over $60</span>
          <CopyCodeButton code="FREESHIP" size="sm" />
        </div>
      </div>
    </div>
  );
}
