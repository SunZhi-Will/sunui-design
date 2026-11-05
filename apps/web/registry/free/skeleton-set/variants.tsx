"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SkeletonSet } from "./skeleton-set";
import { copy, OrderList, picks, ProductPick, TrackingList } from "./demo";

// demo 用到的三種骨架形狀，各一張卡
export const variants = ["product", "list", "rows"] as const;

/** 首頁型錄：骨架與真實內容輪流出現，看得到交叉淡入。 */
export default function SkeletonSetVariant({ variant }: { variant: string }) {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLoaded((l) => !l), loaded ? 2600 : 1400);
    return () => window.clearTimeout(id);
  }, [loaded]);

  if (variant === "product") {
    return (
      <SkeletonSet loaded={loaded} skeleton="product" locale={locale} className="w-48">
        <ProductPick kind={picks[0].kind} price={picks[0].price} />
      </SkeletonSet>
    );
  }

  if (variant === "list") {
    return (
      <SkeletonSet loaded={loaded} skeleton="list" count={3} locale={locale} className="w-80">
        <OrderList />
      </SkeletonSet>
    );
  }

  return (
    <SkeletonSet loaded={loaded} skeleton="rows" count={3} label={t.trackingLabel} locale={locale} className="w-80">
      <TrackingList />
    </SkeletonSet>
  );
}
