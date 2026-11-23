import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VariantWall } from "@/components/variant-wall";
import cards from "@/content/catalog-cards.json";
import { DemoLocaleProvider } from "@/lib/demo-locale";
import { getItem } from "@/lib/registry";
import { variantIds } from "@/registry/__generated__/variants";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  robots: { index: false },
};

const walls = cards.walls as Record<string, string[]>;

export function generateStaticParams() {
  return Object.keys(walls).map((slug) => ({ slug }));
}

/**
 * 效果庫的型錄卡片畫面：一張卡同時跑好幾種樣式（content/catalog-cards.json 的 walls），
 * 而不是只秀一個代表樣式。只給 record-cards.mjs 錄影用。
 */
export default async function WallPreviewPage({ params }: Props) {
  const { slug } = await params;
  const item = getItem(slug);
  const picks = (walls[slug] ?? []).filter((id) => variantIds[slug]?.includes(id));
  if (!item || !picks.length) notFound();

  return (
    <>
      <style>{"nextjs-portal{display:none}"}</style>
      <DemoLocaleProvider>
        <VariantWall name={slug} variants={picks} />
      </DemoLocaleProvider>
    </>
  );
}
