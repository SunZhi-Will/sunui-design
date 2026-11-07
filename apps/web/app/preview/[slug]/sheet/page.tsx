import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockPreview } from "@/components/block-preview";
import { FitStage } from "@/components/fit-stage";
import { DemoLocaleProvider } from "@/lib/demo-locale";
import { getLocale } from "@/lib/i18n-server";
import { getItem, getItems } from "@/lib/registry";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  robots: { index: false },
};

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

/** 展開面板用：完整 demo、原尺寸，舞台跟著 block 的底色滿版，太高時在面板裡捲動。 */
export default async function SheetPreviewPage({ params }: Props) {
  const item = getItem((await params).slug);
  if (!item) notFound();
  const locale = await getLocale();

  return (
    <>
      {/* 開發模式的 Next.js 標誌會出現在面板預覽裡，一律隱藏 */}
      <style>{"nextjs-portal{display:none}"}</style>
      <FitStage mode="sheet">
        <DemoLocaleProvider locale={locale}>
          <BlockPreview name={item.name} />
        </DemoLocaleProvider>
      </FitStage>
    </>
  );
}
