"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { CopyCodeButton } from "./copy-code-button";

const copy = {
  en: { offer: "Extra 20% off your first order:", caption: "20% off" },
  "zh-TW": { offer: "首購再享 8 折：", caption: "8 折" },
  "zh-CN": { offer: "首单再享 8 折：", caption: "8 折" },
  ja: { offer: "初回注文がさらに 20% オフ：", caption: "20% オフ" },
};

/** 型錄卡片：一件商品配一張折扣碼，點一下看複製後蓋章的那一下。 */
export default function CopyCodeButtonCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  return (
    <div className="mx-auto flex w-64 flex-col gap-3 rounded-md border border-border bg-card p-3 text-card-foreground">
      <div className="flex items-center gap-3">
        <ProductArt kind="tote" className="size-16 shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{names.tote}</p>
          <p className="text-sm tabular-nums">$48.00</p>
        </div>
      </div>
      <p className="text-sm">{t.offer}</p>
      <CopyCodeButton code="SUNNY20" caption={t.caption} size="lg" locale={locale} />
    </div>
  );
}
