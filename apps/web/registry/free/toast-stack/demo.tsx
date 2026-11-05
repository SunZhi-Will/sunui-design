"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { ToastStack, useToasts } from "./toast-stack";

const products: { kind: ProductKind; price: string; soldOut?: boolean }[] = [
  { kind: "sneaker", price: "$88" },
  { kind: "mug", price: "$24" },
  { kind: "jacket", price: "$148", soldOut: true },
  { kind: "tote", price: "$36" },
];

const copy = {
  en: {
    heading: "New this week",
    cart: (n: number) => `Cart (${n})`,
    variants: { sneaker: "Chalk, size 42", mug: "Oat glaze, 350 ml", jacket: "Navy canvas, M", tote: "Natural, one size" } as Partial<Record<ProductKind, string>>,
    added: "Added to cart",
    removed: "Removed from cart",
    undo: "Undo",
    emailTitle: "We'll email you",
    emailBody: (name: string) => `When the ${name} is back in M.`,
    notify: ["Notify", " me"],
    add: ["Add", " to cart"],
  },
  "zh-TW": {
    heading: "本週新品",
    cart: (n: number) => `購物車（${n}）`,
    variants: { sneaker: "粉筆白，42 號", mug: "燕麥釉，350 ml", jacket: "海軍藍帆布，M", tote: "原色，單一尺寸" },
    added: "已加入購物車",
    removed: "已從購物車移除",
    undo: "復原",
    emailTitle: "到貨時會寄信通知你",
    emailBody: (name: string) => `${name} M 號補貨時通知你。`,
    notify: ["到貨", "通知"],
    add: ["加入", "購物車"],
  },
  "zh-CN": {
    heading: "本周新品",
    cart: (n: number) => `购物车（${n}）`,
    variants: { sneaker: "粉笔白，42 码", mug: "燕麦釉，350 ml", jacket: "海军蓝帆布，M", tote: "原色，均码" },
    added: "已加入购物车",
    removed: "已从购物车移除",
    undo: "撤销",
    emailTitle: "到货后会发邮件通知你",
    emailBody: (name: string) => `${name} M 码补货时通知你。`,
    notify: ["到货", "通知"],
    add: ["加入", "购物车"],
  },
  ja: {
    heading: "今週の新着",
    cart: (n: number) => `カート（${n}）`,
    variants: { sneaker: "チョーク、42", mug: "オート釉、350 ml", jacket: "ネイビーキャンバス、M", tote: "ナチュラル、フリー" },
    added: "カートに追加しました",
    removed: "カートから削除しました",
    undo: "元に戻す",
    emailTitle: "メールでお知らせします",
    emailBody: (name: string) => `${name}の M が再入荷したらお知らせします。`,
    notify: ["入荷", "通知"],
    add: ["カート", "に追加"],
  },
};

export default function ToastStackDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  const { toasts, push, dismiss } = useToasts();
  const [cart, setCart] = useState(2);

  const add = (kind: ProductKind, variant: string) => {
    setCart((n) => n + 1);
    push({
      title: t.added,
      description: `${names[kind]}, ${variant}`,
      media: <ProductArt kind={kind} />,
      action: {
        label: t.undo,
        onClick: () => {
          setCart((n) => Math.max(0, n - 1));
          push({ title: t.removed, description: names[kind], tone: "info" });
        },
      },
    });
  };

  return (
    <div className="relative h-[460px] w-full max-w-2xl overflow-hidden rounded-md border border-border bg-background text-foreground">
      <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight">{t.heading}</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{t.cart(cart)}</span>
      </div>
      <ul className="divide-y divide-border">
        {products.map((p) => {
          const variant = t.variants[p.kind] ?? "";
          return (
            <li key={p.kind} className="flex items-center gap-3 px-5 py-3">
              <ProductArt kind={p.kind} className="size-12 shrink-0 rounded-[3px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{names[p.kind]}</p>
                <p className="truncate text-xs text-muted-foreground">{variant}</p>
              </div>
              <span className="text-sm font-medium tracking-tight tabular-nums">{p.price}</span>
              {p.soldOut ? (
                <button
                  type="button"
                  onClick={() => push({ title: t.emailTitle, description: t.emailBody(names[p.kind]), tone: "success" })}
                  className="min-w-[4.5rem] shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors sm:w-28 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {t.notify[0]}
                  <span className="hidden sm:inline">{t.notify[1]}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => add(p.kind, variant)}
                  className="min-w-[4.5rem] shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground sm:w-28 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {t.add[0]}
                  <span className="hidden sm:inline">{t.add[1]}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} locale={locale} />
    </div>
  );
}
