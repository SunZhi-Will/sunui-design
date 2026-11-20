"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PhoneFrame, PhonePair } from "./phone-frame";

const copy = {
  en: {
    label: "Buyer's phone",
    cart: "Cart",
    total: "Total",
    pay: "Pay",
    items: ["Stoneware Mug", "Canvas Tote"],
    pair: "Product page and cart on two phones",
    product: "Stoneware Mug",
    detail: "Hand-glazed, 350 ml, dishwasher safe.",
    add: "Add to cart",
  },
  "zh-TW": {
    label: "買家的手機",
    cart: "購物車",
    total: "合計",
    pay: "付款",
    items: ["石陶馬克杯", "帆布托特包"],
    pair: "兩支手機上的商品頁與購物車",
    product: "石陶馬克杯",
    detail: "手工上釉，350 ml，可用洗碗機。",
    add: "加入購物車",
  },
  "zh-CN": {
    label: "买家的手机",
    cart: "购物车",
    total: "合计",
    pay: "付款",
    items: ["石陶马克杯", "帆布托特包"],
    pair: "两部手机上的商品页与购物车",
    product: "石陶马克杯",
    detail: "手工上釉，350 ml，可用洗碗机。",
    add: "加入购物车",
  },
  ja: {
    label: "購入者のスマホ",
    cart: "カート",
    total: "合計",
    pay: "支払う",
    items: ["ストーンウェアマグ", "キャンバストート"],
    pair: "2 台のスマホに表示した商品ページとカート",
    product: "ストーンウェアマグ",
    detail: "手作業の釉薬仕上げ、350 ml、食洗機対応。",
    add: "カートに入れる",
  },
};

type Copy = (typeof copy)["en"];

const prices = ["$36.00", "$24.00"];

function CartScreen({ t }: { t: Copy }) {
  return (
    <div className="space-y-3 p-4 text-sm">
      <p className="font-semibold">{t.cart}</p>
      {t.items.map((name, i) => (
        <div key={name} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-9 shrink-0 rounded-lg bg-[var(--wf-sunken)]" />
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
  );
}

function ProductScreen({ t }: { t: Copy }) {
  return (
    <div className="space-y-3 p-3 text-sm">
      <span aria-hidden="true" className="block aspect-square rounded-xl bg-[var(--wf-sunken)]" />
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">{t.product}</p>
        <span className="tabular-nums">$36.00</span>
      </div>
      <p className="text-xs text-[var(--wf-fg-muted)]">{t.detail}</p>
      <span className="block rounded-xl bg-[var(--wf-fg)] py-2.5 text-center font-semibold text-[var(--wf-surface)]">
        {t.add}
      </span>
    </div>
  );
}

export default function PhoneFrameDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="flex w-full max-w-4xl min-w-0 flex-col items-center gap-10 md:flex-row md:items-start md:justify-center">
      <PhoneFrame
        url="shop.example.com/cart"
        width={260}
        height={420}
        label={t.label}
        locale={locale}
        className="shrink-0"
      >
        <CartScreen t={t} />
      </PhoneFrame>
      <PhonePair
        label={t.pair}
        locale={locale}
        backFrame={{ url: "shop.example.com/mug" }}
        frontFrame={{ time: "20:43" }}
        back={<ProductScreen t={t} />}
        front={<CartScreen t={t} />}
        className="md:max-w-[400px]"
      />
    </div>
  );
}
