import { notFound } from "next/navigation";

import { BlockSheet } from "@/components/block-sheet";
import { getItem, getItems, installCommand } from "@/lib/registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

/** 站內點卡片時攔截 /blocks/<name>，就地展開成面板；直接開網址仍是完整頁面。 */
export default async function BlockSheetPage({ params }: Props) {
  const item = getItem((await params).slug);
  if (!item) notFound();

  return (
    <BlockSheet
      item={{
        name: item.name,
        title: item.title,
        description: item.description,
        tier: item.meta.tier,
        install: item.meta.tier === "free" ? installCommand(item) : null,
      }}
    />
  );
}
