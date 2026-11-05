"use client";

import { cardPreviews, previews } from "@/registry/__generated__/previews";

export function BlockPreview({ name, variant = "demo" }: { name: string; variant?: "demo" | "card" }) {
  // 型錄卡片優先用 card.tsx（只放核心互動），沒有就沿用完整 demo
  const Preview = (variant === "card" ? cardPreviews[name] : undefined) ?? previews[name];
  // 外層 div 一定存在，PreviewFrame 才量得到高度（block 本身在 client 才載入）
  return <div className="flex w-full justify-center">{Preview ? <Preview /> : null}</div>;
}
