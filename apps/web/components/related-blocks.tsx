import { BlockCard, type BlockCardLabels } from "@/components/block-card";
import type { Locale } from "@/lib/i18n";
import type { Tier } from "@/lib/registry";

export type RelatedCard = { name: string; title: string; tier: Tier };

/** 區塊頁底部的相似區塊：跟首頁型錄同一種卡片。 */
export function RelatedBlocks({
  items,
  locale,
  heading,
  labels,
}: {
  items: RelatedCard[];
  locale: Locale;
  heading: string;
  labels: BlockCardLabels;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="mt-16">
      <h2 id="related-title" className="mb-4 text-lg font-semibold tracking-tight">
        {heading}
      </h2>
      <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <BlockCard key={item.name} {...item} locale={locale} labels={labels} />
        ))}
      </ul>
    </section>
  );
}
