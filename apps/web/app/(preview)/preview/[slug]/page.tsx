import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockPreview } from "@/components/block-preview";
import { DemoLocaleProvider } from "@/lib/demo-locale";
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

  return (
    <div data-preview-stage className="stage-dots flex min-h-dvh items-center justify-center p-4 sm:p-8">
      {/* 語言在瀏覽器端才確定，demo 晚一拍才出現：外層 div 先在，block 頁的 PreviewFrame 載入時才量得到它 */}
      <div className="flex w-full justify-center">
        <DemoLocaleProvider>
          <BlockPreview name={item.name} />
        </DemoLocaleProvider>
      </div>
    </div>
  );
}
