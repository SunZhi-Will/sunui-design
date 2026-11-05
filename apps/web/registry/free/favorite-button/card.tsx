"use client";

import { useState } from "react";

import { ProductArt, productNames } from "@/registry/_demo/product-art";

import { FavoriteButton } from "./favorite-button";

/** 型錄卡片：一件商品角落的愛心，點一下看收藏蓋章與數字跳動。 */
export default function FavoriteButtonCard() {
  const [pressed, setPressed] = useState(false);
  const name = productNames.jacket;

  return (
    <div className="mx-auto w-48">
      <div className="relative h-36 overflow-hidden rounded-md [&>*]:h-full">
        <ProductArt kind="jacket" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-sm text-muted-foreground tabular-nums">$128</p>
        </div>
        <FavoriteButton
          pressed={pressed}
          onPressedChange={setPressed}
          count={pressed ? 1249 : 1248}
          labels={{ add: `Save ${name}`, remove: `Remove ${name} from saved` }}
        />
      </div>
    </div>
  );
}
