"use client";

import { variantPreviews } from "@/registry/__generated__/previews";

export function VariantPreview({ name, variant }: { name: string; variant: string }) {
  const Preview = variantPreviews[name];
  // 外層 div 一定存在，FitStage 才量得到尺寸（block 本身在 client 才載入）
  return <div className="flex w-full justify-center">{Preview ? <Preview variant={variant} /> : null}</div>;
}
