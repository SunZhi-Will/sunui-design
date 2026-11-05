"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames, type ProductKind } from "@/registry/_demo/product-art";

import { ToastStack, useToasts, useUndoable } from "./toast-stack";

const products: { kind: ProductKind; price: string; soldOut?: boolean }[] = [
  { kind: "sneaker", price: "$88" },
  { kind: "mug", price: "$24" },
  { kind: "jacket", price: "$148", soldOut: true },
];

const prices: Partial<Record<ProductKind, string>> = { sneaker: "$88", mug: "$24", tote: "$36", bottle: "$32" };

type Line = { id: string; kind: ProductKind };

const copy = {
  en: {
    heading: "New this week",
    variants: { sneaker: "Chalk, size 42", mug: "Oat glaze, 350 ml", jacket: "Navy canvas, M", tote: "Natural, one size", bottle: "Brushed steel" } as Partial<Record<ProductKind, string>>,
    added: "Added to cart",
    removed: "Removed from cart",
    undo: "Undo",
    emailTitle: "We'll email you",
    emailBody: (name: string) => `When the ${name} is back in M.`,
    notify: ["Notify", " me"],
    add: ["Add", " to cart"],
    cart: "Your cart",
    count: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    remove: (name: string) => `Remove ${name}`,
    removedName: (name: string) => `Removed ${name}`,
    empty: "Your cart is empty.",
  },
  "zh-TW": {
    heading: "本週新品",
    variants: { sneaker: "粉筆白，42 號", mug: "燕麥釉，350 ml", jacket: "海軍藍帆布，M", tote: "原色，單一尺寸", bottle: "髮絲紋不鏽鋼" },
    added: "已加入購物車",
    removed: "已從購物車移除",
    undo: "復原",
    emailTitle: "到貨時會寄信通知你",
    emailBody: (name: string) => `${name} M 號補貨時通知你。`,
    notify: ["到貨", "通知"],
    add: ["加入", "購物車"],
    cart: "購物車",
    count: (n: number) => `${n} 件`,
    remove: (name: string) => `移除 ${name}`,
    removedName: (name: string) => `已移除 ${name}`,
    empty: "購物車是空的。",
  },
  "zh-CN": {
    heading: "本周新品",
    variants: { sneaker: "粉笔白，42 码", mug: "燕麦釉，350 ml", jacket: "海军蓝帆布，M", tote: "原色，均码", bottle: "拉丝不锈钢" },
    added: "已加入购物车",
    removed: "已从购物车移除",
    undo: "撤销",
    emailTitle: "到货后会发邮件通知你",
    emailBody: (name: string) => `${name} M 码补货时通知你。`,
    notify: ["到货", "通知"],
    add: ["加入", "购物车"],
    cart: "购物车",
    count: (n: number) => `${n} 件`,
    remove: (name: string) => `移除 ${name}`,
    removedName: (name: string) => `已移除 ${name}`,
    empty: "购物车是空的。",
  },
  ja: {
    heading: "今週の新着",
    variants: { sneaker: "チョーク、42", mug: "オート釉、350 ml", jacket: "ネイビーキャンバス、M", tote: "ナチュラル、フリー", bottle: "ヘアライン仕上げのスチール" },
    added: "カートに追加しました",
    removed: "カートから削除しました",
    undo: "元に戻す",
    emailTitle: "メールでお知らせします",
    emailBody: (name: string) => `${name}の M が再入荷したらお知らせします。`,
    notify: ["入荷", "通知"],
    add: ["カート", "に追加"],
    cart: "カート",
    count: (n: number) => `${n} 点`,
    remove: (name: string) => `${name}を削除`,
    removedName: (name: string) => `${name}を削除しました`,
    empty: "カートは空です。",
  },
};

const iconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:size-8";

export default function ToastStackDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useProductNames();
  const { toasts, push, dismiss } = useToasts();
  const [cart, setCart] = useState<Line[]>([
    { id: "l1", kind: "tote" },
    { id: "l2", kind: "bottle" },
  ]);
  const seq = useRef(2);
  // 移除立刻生效，通知上給「復原」，不跳確認視窗
  const undoable = useUndoable(cart, setCart, { push }, { locale });

  const add = (kind: ProductKind, variant: string) => {
    seq.current += 1;
    const id = `l${seq.current}`;
    setCart((list) => [{ id, kind }, ...list]);
    push({
      title: t.added,
      description: `${names[kind]}, ${variant}`,
      media: <ProductArt kind={kind} />,
      action: {
        label: t.undo,
        onClick: () => {
          setCart((list) => list.filter((l) => l.id !== id));
          push({ title: t.removed, description: names[kind], tone: "info" });
        },
      },
    });
  };

  const remove = (line: Line) =>
    undoable((list) => list.filter((l) => l.id !== line.id), t.removedName(names[line.kind]), {
      description: t.variants[line.kind],
      media: <ProductArt kind={line.kind} />,
    });

  return (
    <div className="relative min-h-[520px] w-full max-w-3xl overflow-hidden rounded-md border border-border bg-background pb-24 text-foreground">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] sm:divide-x sm:divide-border">
        <section aria-labelledby="ts-new">
          <h2 id="ts-new" className="border-b border-border px-5 py-4 text-base font-semibold tracking-tight">
            {t.heading}
          </h2>
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
                      className="min-w-[4.5rem] shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-28"
                    >
                      {t.notify[0]}
                      <span className="hidden sm:inline">{t.notify[1]}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => add(p.kind, variant)}
                      className="min-w-[4.5rem] shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:w-28"
                    >
                      {t.add[0]}
                      <span className="hidden sm:inline">{t.add[1]}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="ts-cart" className="border-t border-border sm:border-t-0">
          <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
            <h2 id="ts-cart" className="text-base font-semibold tracking-tight">
              {t.cart}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">{t.count(cart.length)}</span>
          </div>
          {cart.length ? (
            <ul className="divide-y divide-border">
              {cart.map((line) => (
                <li key={line.id} className="flex items-center gap-3 py-2.5 pr-3 pl-5">
                  <ProductArt kind={line.kind} className="size-10 shrink-0 rounded-[3px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{names[line.kind]}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{prices[line.kind]}</p>
                  </div>
                  <button type="button" aria-label={t.remove(names[line.kind])} onClick={() => remove(line)} className={iconButton}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">{t.empty}</p>
          )}
        </section>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} locale={locale} />
    </div>
  );
}
