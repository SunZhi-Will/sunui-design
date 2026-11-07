import type { Metadata } from "next";

import { VariantStage, variantStaticParams, type VariantParams } from "./variant-stage";

export const metadata: Metadata = {
  robots: { index: false },
};

export const generateStaticParams = variantStaticParams;

/** 效果庫的單一樣式，首頁卡片用。展開面板用同層的 sheet/。 */
export default function VariantCardPage({ params }: { params: VariantParams }) {
  return <VariantStage params={params} mode="card" />;
}
