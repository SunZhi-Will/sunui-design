"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PhoneFrame } from "./phone-frame";

const copy = {
  en: { label: "Buyer's phone", cart: "Cart", total: "Total", pay: "Pay", items: ["Stoneware Mug", "Canvas Tote"] },
  "zh-TW": { label: "買家的手機", cart: "購物車", total: "合計", pay: "付款", items: ["石陶馬克杯", "帆布托特包"] },
  "zh-CN": { label: "买家的手机", cart: "购物车", total: "合计", pay: "付款", items: ["石陶马克杯", "帆布托特包"] },
  ja: { label: "購入者のスマホ", cart: "カート", total: "合計", pay: "支払う", items: ["ストーンウェアマグ", "キャンバストート"] },
};

const prices = ["$36.00", "$24.00"];

export default function PhoneFrameDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <PhoneFrame
      url="shop.example.com/cart"
      width={260}
      height={420}
      label={t.label}
      locale={locale}
      className="mx-auto"
    >
      <div className="space-y-3 p-4 text-sm">
        <p className="font-semibold">{t.cart}</p>
        {t.items.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-9 shrink-0 rounded-lg bg-[var(--wf-sunken)]"
            />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="tabular-nums">{prices[i]}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[var(--wf-line)] pt-2 font-semibold">
          <span>{t.total}</span>
          <span className="tabular-nums">$60.00</span>
        </div>
        <span className="block rounded-xl bg-[var(--wf-fg)] py-2.5 text-center font-semibold text-[var(--wf-surface)]">
          {t.pay} $60.00
        </span>
      </div>
    </PhoneFrame>
  );
}
