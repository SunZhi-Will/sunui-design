import { notFound } from "next/navigation";

import { BlockSheet } from "@/components/block-sheet";
import { getI18n } from "@/lib/i18n-server";
import { getItem, getItems, installCommand } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";
import { variantIds } from "@/registry/__generated__/variants";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ style?: string }> };

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

/** 站內點卡片時攔截 /blocks/<name>，就地展開成面板；直接開網址仍是完整頁面。 */
export default async function BlockSheetPage({ params, searchParams }: Props) {
  const item = getItem((await params).slug);
  if (!item) notFound();
  // ?style= 來自效果庫的單一樣式卡片；不認得的樣式就退回完整 demo
  const style = (await searchParams).style;
  const variant = style && variantIds[item.name]?.includes(style) ? style : undefined;
  const { locale } = await getI18n();
  const localized = localizeItem(item, locale);

  return (
    <BlockSheet
      item={{
        name: item.name,
        variant,
        title: variant ? `${localized.title} · ${variant}` : localized.title,
        description: localized.description,
        tier: item.meta.tier,
        install: item.meta.tier === "free" ? installCommand(item) : null,
      }}
    />
  );
}
