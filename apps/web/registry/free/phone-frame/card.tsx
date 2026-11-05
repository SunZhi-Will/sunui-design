"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PhoneFrame } from "./phone-frame";

const copy = {
  en: { cart: "Cart", total: "Total", pay: "Pay", items: ["Stoneware Mug", "Canvas Tote", "Linen Napkin", "Oak Coaster"] },
  "zh-TW": { cart: "購物車", total: "合計", pay: "付款", items: ["石陶馬克杯", "帆布托特包", "亞麻餐巾", "橡木杯墊"] },
  "zh-CN": { cart: "购物车", total: "合计", pay: "付款", items: ["石陶马克杯", "帆布托特包", "亚麻餐巾", "橡木杯垫"] },
  ja: { cart: "カート", total: "合計", pay: "支払う", items: ["ストーンウェアマグ", "キャンバストート", "リネンナプキン", "オークのコースター"] },
};

const prices = ["$36", "$24", "$12", "$9"];

/** 型錄卡片：一支小手機框，螢幕裡的購物車可以上下捲動。 */
export default function PhoneFrameCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <PhoneFrame url="shop.example.com" width={150} height={236} locale={locale} className="mx-auto">
      <div className="space-y-2.5 p-3 text-[11px]">
        <p className="font-semibold">{t.cart}</p>
        {t.items.map((name, i) => (
          <div key={name} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-6 shrink-0 rounded-md bg-[var(--wf-sunken)]" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="tabular-nums">{prices[i]}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[var(--wf-line)] pt-2 font-semibold">
          <span>{t.total}</span>
          <span className="tabular-nums">$81</span>
        </div>
        <span className="block rounded-lg bg-[var(--wf-fg)] py-2 text-center font-semibold text-[var(--wf-surface)]">{t.pay} $81</span>
      </div>
    </PhoneFrame>
  );
}
