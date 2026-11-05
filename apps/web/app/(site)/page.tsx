import type { Metadata } from "next";
import Link from "next/link";

import { Catalog } from "@/components/catalog";
import { Command } from "@/components/command";
import { WaitlistForm } from "@/components/waitlist-form";
import { getI18n } from "@/lib/i18n-server";
import { getItems, installCommand, type Series } from "@/lib/registry";
import { seriesOf } from "@/lib/series";
import { localizeItem } from "@/lib/registry-i18n";
import { variantIds } from "@/registry/__generated__/variants";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: { absolute: m.home.metaTitle }, description: m.meta.siteDescription };
}

export default async function HomePage() {
  const { locale, m } = await getI18n();
  const all = getItems();
  // 紙感電商是主線，排最前面，其中 Pro 先出現；動效庫排最後，免得首頁第一眼只看到特效
  const seriesRank: Record<Series, number> = { paper: 0, story: 1, showcase: 2, product: 3, motion: 4 };
  const items = [...all]
    .sort(
      (a, b) =>
        seriesRank[seriesOf(a)] - seriesRank[seriesOf(b)] ||
        Number(b.meta.tier === "pro") - Number(a.meta.tier === "pro") ||
        b.meta.addedAt.localeCompare(a.meta.addedAt) ||
        a.title.localeCompare(b.title),
    )
    .flatMap((item) => {
      const { name, title, description, meta, categories } = localizeItem(item, locale);
      // 保留英文標題與描述給搜尋用
      const base = { name, title, description, meta, categories, search: `${item.title} ${item.description}` };
      // 效果庫一種樣式一張卡，避免好幾種效果擠在同一個預覽裡看不清楚；型錄預設會收合成一張
      const variants = variantIds[name];
      if (!variants) return [base];
      return variants.map((variant) => ({
        ...base,
        variant,
        title: `${title} · ${variant}`,
        libraryTitle: title,
        styleCount: variants.length,
        search: `${base.search} ${variant}`,
      }));
    });
  const freeCount = all.filter((item) => item.meta.tier === "free").length;
  const proCount = all.length - freeCount;
  const firstFree = all.find((item) => item.meta.tier === "free");

  return (
    <>
      <section className="py-16 sm:py-24">
        <p className="mb-4 text-sm font-medium text-accent">{m.home.eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {m.home.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-subtle">
          {m.home.lead}
        </p>
        {firstFree && (
          <div className="mt-8 max-w-2xl">
            <Command value={installCommand(firstFree)} />
          </div>
        )}
        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <Stat label={m.home.statBlocks} value={all.length} />
          <Stat label={m.home.statFree} value={freeCount} />
          <Stat label={m.home.statPro} value={proCount} />
        </dl>
      </section>

      <Catalog
        items={items}
        locale={locale}
        messages={{ catalog: m.catalog, interactions: m.interactions, series: m.series, tier: m.tier }}
      />

      <section aria-labelledby="why-title" className="mt-24">
        <h2 id="why-title" className="text-2xl font-semibold tracking-tight">
          {m.home.whyTitle}
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {m.home.reasons.map((reason) => (
            <div key={reason.title} className="rounded-2xl border border-line bg-card p-6">
              <h3 className="font-medium">{reason.title}</h3>
              <p className="mt-2 text-sm text-pretty text-subtle">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="pro-title"
        className="mt-24 grid gap-8 rounded-3xl border border-accent/40 bg-accent-soft/40 p-8 md:grid-cols-[1.2fr_1fr] md:items-center sm:p-10"
      >
        <div>
          <p className="text-sm font-medium text-accent">{m.home.proEyebrow}</p>
          <h2 id="pro-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            {m.home.proTitle}
          </h2>
          <p className="mt-3 text-pretty text-subtle">
            {m.home.proBody(proCount)}
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex rounded-xl bg-fg px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90"
          >
            {m.common.seePricing}
          </Link>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">{m.common.launchUpdates}</p>
          <WaitlistForm source="home" messages={m.waitlist} />
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    // dt 在前符合 dl 結構，視覺上用 order 讓數字排在前面，標籤只寫一次
    <div className="flex items-baseline gap-2">
      <dt className="order-2 text-subtle">{label}</dt>
      <dd className="order-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}
