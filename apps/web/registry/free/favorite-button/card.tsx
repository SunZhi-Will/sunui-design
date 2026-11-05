"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { FavoriteButton } from "./favorite-button";

const copy = {
  en: { save: (n: string) => `Save ${n}`, unsave: (n: string) => `Remove ${n} from saved` },
  "zh-TW": { save: (n: string) => `收藏 ${n}`, unsave: (n: string) => `把 ${n} 移出收藏` },
  "zh-CN": { save: (n: string) => `收藏 ${n}`, unsave: (n: string) => `把 ${n} 移出收藏` },
  ja: { save: (n: string) => `${n}を保存`, unsave: (n: string) => `${n}を保存から外す` },
};

/** 型錄卡片：一件商品角落的愛心，點一下看收藏蓋章與數字跳動。 */
export default function FavoriteButtonCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [pressed, setPressed] = useState(false);
  const name = useProductNames().jacket;

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
          locale={locale}
          pressed={pressed}
          onPressedChange={setPressed}
          count={pressed ? 1249 : 1248}
          labels={{ add: t.save(name), remove: t.unsave(name) }}
        />
      </div>
    </div>
  );
}
