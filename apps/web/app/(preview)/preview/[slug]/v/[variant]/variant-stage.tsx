import { notFound } from "next/navigation";

import { FitStage } from "@/components/fit-stage";
import { VariantPreview } from "@/components/variant-preview";
import { DemoLocaleProvider } from "@/lib/demo-locale";
import { getItem } from "@/lib/registry";
import { variantIds } from "@/registry/__generated__/variants";

export type VariantParams = Promise<{ slug: string; variant: string }>;

export function variantStaticParams() {
  return Object.entries(variantIds).flatMap(([slug, ids]) => ids.map((variant) => ({ slug, variant })));
}

/** 效果庫拆開後的單一樣式：卡片（page.tsx）與展開面板（sheet/page.tsx）共用。 */
export async function VariantStage({ params, mode }: { params: VariantParams; mode: "card" | "sheet" }) {
  const { slug, variant } = await params;
  const item = getItem(slug);
  if (!item || !variantIds[slug]?.includes(variant)) notFound();

  return (
    <>
      {/* 開發模式的 Next.js 標誌會出現在每張卡片裡，一律隱藏 */}
      <style>{"nextjs-portal{display:none}"}</style>
      <FitStage mode={mode}>
        <DemoLocaleProvider>
          <VariantPreview name={slug} variant={variant} />
        </DemoLocaleProvider>
      </FitStage>
    </>
  );
}
