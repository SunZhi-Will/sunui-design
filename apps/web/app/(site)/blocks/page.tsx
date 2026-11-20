import type { Metadata } from "next";

import { Catalog } from "@/components/catalog";
import { buildCatalogItems } from "@/lib/catalog-items";
import { getI18n } from "@/lib/i18n-server";
import { getItems } from "@/lib/registry";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.nav.blocks, description: m.home.sections.catalog.body, alternates: { canonical: "/blocks" } };
}

/** 完整型錄：搜尋、篩選、合輯、收藏。2026-11-19 從首頁搬來，首頁只留九張精選。 */
export default async function BlocksPage() {
  const { locale, m } = await getI18n();
  const t = m.home.sections.catalog;
  const items = buildCatalogItems(getItems(), locale);

  return (
    <div className="pt-8 sm:pt-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-subtle">{t.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-balance [word-break:auto-phrase] sm:text-5xl">{t.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-pretty text-subtle sm:mt-4 sm:text-lg">{t.body}</p>
      </div>
      <div className="mt-7 sm:mt-10">
        <Catalog
          items={items}
          locale={locale}
          messages={{ catalog: m.catalog, collections: m.collections, interactions: m.interactions, series: m.series, tier: m.tier }}
        />
      </div>
    </div>
  );
}
