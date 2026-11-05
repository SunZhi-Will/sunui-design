import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockPreview } from "@/components/block-preview";
import { FitStage } from "@/components/fit-stage";
import { DemoLocaleProvider } from "@/lib/demo-locale";
import { getLocale } from "@/lib/i18n-server";
import { getItem, getItems } from "@/lib/registry";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const metadata: Metadata = {
  robots: { index: false },
};

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

/** 型錄卡片用：iframe 寬度就是卡片寬度，block 的斷點會依卡片寬度生效，以原尺寸顯示。 */
export default async function CardPreviewPage({ params }: Props) {
  const item = getItem((await params).slug);
  if (!item) notFound();
  const locale = await getLocale();

  return (
    <>
      {/* 開發模式的 Next.js 標誌會出現在每張卡片裡，卡片舞台一律隱藏 */}
      <style>{"nextjs-portal{display:none}"}</style>
      <FitStage>
        <DemoLocaleProvider locale={locale}>
          <BlockPreview name={item.name} variant="card" />
        </DemoLocaleProvider>
      </FitStage>
    </>
  );
}
