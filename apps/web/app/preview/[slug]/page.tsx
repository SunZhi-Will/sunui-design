import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockPreview } from "@/components/block-preview";
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

/** 只渲染 block 本身，供 block 頁以 iframe 嵌入，讓斷點依 iframe 寬度生效。 */
export default async function PreviewPage({ params }: Props) {
  const item = getItem((await params).slug);
  if (!item) notFound();
  const locale = await getLocale();

  return (
    <div data-preview-stage className="stage-dots flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <DemoLocaleProvider locale={locale}>
        <BlockPreview name={item.name} />
      </DemoLocaleProvider>
    </div>
  );
}
