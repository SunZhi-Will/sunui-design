"use client";

import { previews } from "@/registry/__generated__/previews";

export function BlockPreview({ name }: { name: string }) {
  const Preview = previews[name];
  // 外層 div 一定存在，PreviewFrame 才量得到高度（block 本身在 client 才載入）
  return <div className="flex w-full justify-center">{Preview ? <Preview /> : null}</div>;
}
