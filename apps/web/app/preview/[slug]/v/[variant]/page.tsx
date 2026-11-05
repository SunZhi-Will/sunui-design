import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FitStage } from "@/components/fit-stage";
import { VariantPreview } from "@/components/variant-preview";
import { DemoLocaleProvider } from "@/lib/demo-locale";
import { getLocale } from "@/lib/i18n-server";
import { getItem } from "@/lib/registry";
import { variantIds } from "@/registry/__generated__/variants";

type Props = {
  params: Promise<{ slug: string; variant: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export const dynamicParams = false;

export const metadata: Metadata = {
  robots: { index: false },
};

export function generateStaticParams() {
  return Object.entries(variantIds).flatMap(([slug, ids]) => ids.map((variant) => ({ slug, variant })));
}

/** 效果庫拆開後的單一樣式：首頁卡片與展開面板共用，?mode=sheet 時用面板舞台。 */
export default async function VariantPreviewPage({ params, searchParams }: Props) {
  const { slug, variant } = await params;
  const item = getItem(slug);
  if (!item || !variantIds[slug]?.includes(variant)) notFound();
  const mode = (await searchParams).mode === "sheet" ? "sheet" : "card";
  const locale = await getLocale();

  return (
    <>
      <style>{"nextjs-portal{display:none}"}</style>
      <FitStage mode={mode}>
        <DemoLocaleProvider locale={locale}>
          <VariantPreview name={slug} variant={variant} />
        </DemoLocaleProvider>
      </FitStage>
    </>
  );
}
