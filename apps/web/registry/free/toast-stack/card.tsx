"use client";

import { ProductArt, productNames } from "@/registry/_demo/product-art";

import { ToastStack, useToasts } from "./toast-stack";

/** 型錄卡片：連按幾次加入購物車，通知疊成一疊，滑過展開、左右拖曳關閉。 */
export default function ToastStackCard() {
  const { toasts, push, dismiss } = useToasts();
  return (
    <div className="relative mx-auto h-[220px] w-72 overflow-hidden rounded-md border border-border bg-background text-foreground">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <ProductArt kind="mug" className="size-10 shrink-0 rounded-[3px]" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{productNames.mug}</p>
        <button
          type="button"
          onClick={() =>
            push({
              title: "Added to cart",
              description: `${productNames.mug}, Oat glaze`,
              media: <ProductArt kind="mug" />,
              action: { label: "Undo", onClick: () => push({ title: "Removed from cart", tone: "info" }) },
            })
          }
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Add
        </button>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} className="right-3 bottom-3 w-[calc(100%-1.5rem)]" />
    </div>
  );
}
