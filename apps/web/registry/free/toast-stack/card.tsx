"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { ProductArt, useProductNames } from "@/registry/_demo/product-art";

import { ToastStack, useToasts } from "./toast-stack";

const copy = {
  en: { added: "Added to cart", removed: "Removed from cart", undo: "Undo", glaze: "Oat glaze", add: "Add" },
  "zh-TW": { added: "已加入購物車", removed: "已從購物車移除", undo: "復原", glaze: "燕麥釉", add: "加入" },
  "zh-CN": { added: "已加入购物车", removed: "已从购物车移除", undo: "撤销", glaze: "燕麦釉", add: "加入" },
  ja: { added: "カートに追加しました", removed: "カートから削除しました", undo: "元に戻す", glaze: "オート釉", add: "追加" },
};

/** 型錄卡片：連按幾次加入購物車，通知疊成一疊，滑過展開、左右拖曳關閉。 */
export default function ToastStackCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const name = useProductNames().mug;
  const { toasts, push, dismiss } = useToasts();
  return (
    <div className="relative mx-auto h-[220px] w-72 overflow-hidden rounded-md border border-border bg-background text-foreground">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <ProductArt kind="mug" className="size-10 shrink-0 rounded-[3px]" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{name}</p>
        <button
          type="button"
          onClick={() =>
            push({
              title: t.added,
              description: `${name}, ${t.glaze}`,
              media: <ProductArt kind="mug" />,
              action: { label: t.undo, onClick: () => push({ title: t.removed, tone: "info" }) },
            })
          }
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t.add}
        </button>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} locale={locale} className="right-3 bottom-3 w-[calc(100%-1.5rem)]" />
    </div>
  );
}
