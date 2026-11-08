import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Link from "next/link";

import { AgentSteps } from "@/components/agent-steps";
import { Catalog } from "@/components/catalog";
import { Command } from "@/components/command";
import { HeroCompare } from "@/components/hero-compare";
import { HeroOpening } from "@/components/hero-opening";
import { PhraseText } from "@/components/phrase-text";
import { WaitlistForm } from "@/components/waitlist-form";
import { getI18n } from "@/lib/i18n-server";
import { orderCatalog } from "@/lib/catalog-order";
import { getItems, installCommand, usesSpot } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";
import { variantIds } from "@/registry/__generated__/variants";

const HERO_TILES = [
  "day-night-hero", "glass-cube-hero", "flash-sale-hero", "launch-stage-hero", "drop-release-hero", "curve-rail-hero",
  "depth-hero", "gift-box-reveal", "order-island", "receipt-printer", "coupon-wallet", "peel-sticker-coupon",
  "scratch-card", "prize-wheel", "stamp-card", "physics-cart-jar", "pixel-boss-sale", "pixel-gacha", "festival-banner",
  "black-friday-weekend", "countdown-banner", "cart-drawer", "checkout-steps", "product-gallery", "flash-sale-product-card",
  "coupon-claim-card", "free-shipping-progress", "gift-card-designer", "fold-invite-card", "launch-countdown-wall",
  "book-3d", "orbit-gallery", "spine-shelf", "photo-looks", "vote-terrain", "showcase-mosaic", "self-building-page",
  "shader-campaign-banner", "price-history", "order-tracker", "variant-picker", "plan-comparison", "testimonial-wall",
  "hotspots", "cloth-curtain", "plush-portrait", "point-cloud", "theme-picker", "loop-shader-hero",
];

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: { absolute: m.home.metaTitle }, description: m.meta.siteDescription };
}

export default async function HomePage() {
  const { locale, m } = await getI18n();
  const all = getItems();
  // 免費與 Pro 交叉排（每排中間一張 Pro），動效庫排最後；規則見 lib/catalog-order.ts
  const items = orderCatalog(all)
    .flatMap((item) => {
      const { name, title, description, meta, categories } = localizeItem(item, locale);
      // 保留英文標題與描述給搜尋用
      const base = {
        name,
        title,
        description,
        meta,
        categories,
        search: `${item.title} ${item.description}`,
        en: { title: item.title, description: item.description },
        spot: usesSpot(item) || undefined,
      };
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
  // 開場紙牆：挑畫面最有份量的區塊，只放有分享圖的
  const heroTiles = HERO_TILES.filter((name) => existsSync(path.join(process.cwd(), "public/og/blocks", `${name}.jpg`)));

  return (
    <>
      {/* 開場：真實區塊鋪成的 3D 紙牆佔滿主視覺，上面只留一句話和安裝指令 */}
      <HeroOpening tiles={heroTiles} featured="day-night-hero">
        <h1 className="text-center text-4xl font-semibold tracking-tight text-balance [overflow-wrap:anywhere] [word-break:auto-phrase] sm:text-6xl">
          <PhraseText text={m.home.title} />
        </h1>
        {firstFree && (
          <div className="mx-auto mt-6 max-w-2xl">
            <Command value={installCommand(firstFree)} />
          </div>
        )}
      </HeroOpening>

      <Catalog
        items={items}
        locale={locale}
        messages={{ catalog: m.catalog, collections: m.collections, interactions: m.interactions, series: m.series, tier: m.tier }}
      />

      {/* 和常見 AI 樣貌並排比較：原本在主視覺，開場改成動畫後移到這裡 */}
      <section aria-label={m.home.compare.label} className="mx-auto mt-24 max-w-xl">
        <HeroCompare m={m.home.compare} />
      </section>

      <AgentSteps m={m.home.agent} />

      <section aria-labelledby="why-title" className="mt-24">
        <h2 id="why-title" className="text-2xl font-semibold tracking-tight">
          {m.home.whyTitle}
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {m.home.reasons.map((reason) => (
            <div key={reason.title} className="rounded-lg border border-line bg-card p-6">
              <h3 className="font-medium">{reason.title}</h3>
              <p className="mt-2 text-sm text-pretty text-subtle">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="pro-title"
        className="mt-24 grid gap-8 rounded-lg border border-fg/80 bg-card p-8 md:grid-cols-[1.2fr_1fr] md:items-center sm:p-10"
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
            className="mt-6 inline-flex rounded-md bg-fg px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90"
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

