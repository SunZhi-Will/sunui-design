import type { Metadata } from "next";

import { VariantStage, variantStaticParams, type VariantParams } from "../variant-stage";

export const metadata: Metadata = {
  robots: { index: false },
};

export const generateStaticParams = variantStaticParams;

/** 效果庫的單一樣式，展開面板用：原尺寸、不縮小，太高時在面板裡捲動。 */
export default function VariantSheetPage({ params }: { params: VariantParams }) {
  return <VariantStage params={params} mode="sheet" />;
}
