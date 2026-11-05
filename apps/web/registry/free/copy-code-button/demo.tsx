"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { CopyCodeButton } from "./copy-code-button";

const copy = {
  en: {
    blurb: "Heavy canvas, leather handles, inside pocket.",
    offer: "Extra 20% off your first order, use at checkout:",
    caption: "20% off",
    shipping: "Free shipping over $60",
  },
  "zh-TW": {
    blurb: "厚磅帆布、皮革提把、內袋。",
    offer: "首購再享 8 折，結帳時輸入：",
    caption: "8 折",
    shipping: "滿 $60 免運",
  },
  "zh-CN": {
    blurb: "厚帆布、皮革提手、内袋。",
    offer: "首单再享 8 折，结账时输入：",
    caption: "8 折",
    shipping: "满 $60 包邮",
  },
  ja: {
    blurb: "厚手のキャンバス、レザーハンドル、内ポケット付き。",
    offer: "初回注文がさらに 20% オフ。お会計時に入力：",
    caption: "20% オフ",
    shipping: "$60 以上で送料無料",
  },
};

export default function CopyCodeButtonDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  return (
    <div className="grid w-full max-w-2xl gap-5 rounded-md border border-border bg-card p-4 text-card-foreground sm:grid-cols-[13rem_1fr] sm:p-5">
      <ProductArt kind="tote" className="aspect-[3/2] rounded-md sm:aspect-square" />

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{names.tote}</h2>
          <p className="mt-0.5 text-lg tabular-nums">$48.00</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">{t.offer}</p>
          <CopyCodeButton code="SUNNY20" caption={t.caption} size="lg" locale={locale} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>{t.shipping}</span>
          <CopyCodeButton code="FREESHIP" size="sm" locale={locale} />
        </div>
      </div>
    </div>
  );
}
