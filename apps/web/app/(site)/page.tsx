import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { permanentRedirect } from "next/navigation";

import { BlockCard } from "@/components/block-card";
import { Command } from "@/components/command";
import { HeroCompare } from "@/components/hero-compare";
import { HomeHero } from "@/components/home/home-hero";
import { SpecimenTable, type SpecimenKey } from "@/components/home/specimen-table";
import { WaitlistForm } from "@/components/waitlist-form";
import { buildCatalogItems } from "@/lib/catalog-items";
import { getI18n } from "@/lib/i18n-server";
import { format } from "@/lib/i18n";
import { intlLocale } from "@/lib/messages";
import { getItem, getItems, installCommand } from "@/lib/registry";
import { foundingState, foundingWindow } from "@/lib/site";


// 「交給 agent」那一段展示的成果：一句話之後裝好的三個區塊
const AGENT_RESULT = ["countdown-banner", "coupon-claim-card", "free-shipping-progress"];
// 首頁展示的 Pro 場景：挑一個動作就有大變化、畫面最完整的。Pro 資料夾不在時整段不出現
const SHOWCASE = ["kelvin-switch", "lamp-dimmer-scene", "theme-reveal", "glass-cube-hero", "launch-stage-hero", "curve-rail-hero"];
// 首頁的九張精選：都是免費區塊，一按就有反應的
const PICKS = ["add-to-cart-button", "depth-hero", "orbit-gallery", "checkout-steps", "animated-number", "theme-picker", "quantity-stepper", "hotspots", "compare-slider"];
const SPECIMEN_BLOCKS: Record<SpecimenKey, string> = {
  cart: "add-to-cart-button",
  toggle: "theme-picker",
  stepper: "quantity-stepper",
  dimmer: "lamp-dimmer-scene",
  price: "animated-number",
  island: "order-island",
  steps: "checkout-steps",
};

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: { absolute: m.home.metaTitle }, description: m.meta.siteDescription };
}

// 型錄搬到 /blocks 之前，篩選與合輯的網址是掛在首頁上的：舊連結帶著這些參數時轉過去
const CATALOG_PARAMS = ["q", "series", "tier", "collection", "saved"];

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (CATALOG_PARAMS.some((key) => key in query)) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) for (const v of [value].flat()) if (v !== undefined) params.append(key, v);
    permanentRedirect(`/blocks?${params}`);
  }
  const { locale, m } = await getI18n();
  const all = getItems();
  const items = buildCatalogItems(all, locale);
  const freeCount = all.filter((item) => item.meta.tier === "free").length;
  const proCount = all.length - freeCount;
  const firstFree = all.find((item) => item.meta.tier === "free");
  // 標本桌每一格左上角的名稱連到對應的正式區塊；區塊不存在（例如 Pro 資料夾不在）就不連
  const specimenLinks = Object.fromEntries(
    Object.entries(SPECIMEN_BLOCKS).flatMap(([key, name]) => (getItem(name) ? [[key, `/blocks/${name}`]] : [])),
  ) as Partial<Record<SpecimenKey, string>>;
  const t = m.home.sections;
  const picks = PICKS.flatMap((name) => items.filter((item) => item.name === name && !("variant" in item)).slice(0, 1));
  const agentBlocks = AGENT_RESULT.flatMap((name) => items.filter((item) => item.name === name && !("variant" in item)).slice(0, 1));
  const cardLabels = { livePreview: m.catalog.livePreview, expand: m.catalog.expand, pro: m.tier.pro };
  const browseLabel = format(m.home.hero.browse, { n: all.length });
  const showcase = SHOWCASE.flatMap((name) => items.filter((item) => item.name === name && !("variant" in item)).slice(0, 1));
  const founding = foundingState();
  const day = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric", timeZone: "Asia/Taipei" });

  return (
    <>
      {/* 開場：左邊文字與兩個按鈕，右邊是標本桌 */}
      <HomeHero
        chip={
          founding === "closed"
            ? undefined
            : {
                text:
                  founding === "upcoming"
                    ? format(m.home.hero.chipUpcoming, { opens: day.format(foundingWindow.opensAt) })
                    : format(m.home.hero.chipOpen, { closes: day.format(new Date(foundingWindow.closesAt.getTime() - 1)) }),
                href: founding === "upcoming" ? "/pricing#waitlist" : "/pricing",
              }
        }
        title={m.home.title}
        sub={m.home.hero.sub}
        primary={{ label: browseLabel, href: "/blocks" }}
        secondary={{ label: m.home.hero.proCta, href: "/pricing" }}
        command={firstFree && <Command value={installCommand(firstFree)} />}
        table={<SpecimenTable copy={m.home.hero.specimens} links={specimenLinks} />}
      />

      {/* 免費區塊：開場正下方就是可以按的東西 */}
      <section aria-labelledby="free-title" className="mt-10 sm:mt-16">
        <SectionHead id="free-title" title={t.free}>
          <Link href="/blocks" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium btn-secondary">
            {format(t.catalog.cta, { n: all.length })}
            <Arrow className="size-3.5" />
          </Link>
        </SectionHead>
        <ul className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((item) => (
              <BlockCard
                key={item.name}
                name={item.name}
                title={item.title}
                tier={item.meta.tier}
                spot={item.spot ? "ink" : undefined}
                poster={item.poster}
                locale={locale}
                labels={cardLabels}
              />
          ))}
        </ul>
      </section>

      {/* Pro 場景 */}
      {showcase.length > 0 && (
        <section aria-labelledby="pro-scenes-title" className="mt-24 sm:mt-32">
          <SectionHead id="pro-scenes-title" title={t.pro}>
            <Link href="/pricing" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold btn-primary">
              {t.proCta}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
          <ul className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((item) => (
                <BlockCard
                  key={item.name}
                  name={item.name}
                  title={item.title}
                  tier={item.meta.tier}
                  spot={item.spot ? "ink" : undefined}
                  poster={item.poster}
                  locale={locale}
                  labels={cardLabels}
                />
            ))}
          </ul>
        </section>
      )}

      {/* 比較示範：只留示範本身 */}
      <section aria-labelledby="compare-title" className="mt-24 sm:mt-32">
        <SectionHead id="compare-title" title={t.compare} />
        <div aria-label={m.home.compare.label} className="mx-auto mt-8 max-w-xl">
          <HeroCompare m={{ ...m.home.compare, caption: "" }} />
        </div>
      </section>

      {/* 交給 agent：一句話進去，裝好的區塊出來 */}
      {agentBlocks.length > 0 && (
        <section aria-labelledby="agent-title" className="mt-24 sm:mt-32">
          <SectionHead id="agent-title" title={t.agent.title}>
            <Link href="/docs/ai-agents" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium btn-secondary">
              {m.home.agent.docs}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
          <div className="mt-8 flex flex-col items-start gap-3">
            <p className="max-w-full rounded-2xl rounded-bl-md bg-fg px-4 py-2.5 text-[15px] font-medium text-bg">{t.agent.prompt}</p>
            <p className="flex items-center gap-2 font-mono text-[13px] text-subtle">
              <svg viewBox="0 0 24 24" className="size-4 text-fg" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {format(t.agent.result, { n: agentBlocks.length })}
            </p>
          </div>
          <ul className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {agentBlocks.map((item) => (
                <BlockCard
                  key={item.name}
                  name={item.name}
                  title={item.title}
                  tier={item.meta.tier}
                  spot={item.spot ? "ink" : undefined}
                  poster={item.poster}
                  locale={locale}
                  labels={cardLabels}
                />
            ))}
          </ul>
        </section>
      )}

      {/* 價格與創始會員 */}
      <section
        aria-labelledby="pro-title"
        className="mt-24 grid gap-10 rounded-2xl bg-card p-8 shadow-e2 sm:mt-32 sm:p-12 md:grid-cols-[1.2fr_1fr] md:items-center"
      >
        <div>
          <h2 id="pro-title" className="text-3xl font-semibold tracking-tight text-balance [word-break:auto-phrase] sm:text-4xl">
            {m.home.proTitle}
          </h2>
          <p className="mt-4 text-pretty text-subtle">{m.home.proBody(proCount)}</p>
          <Link href="/pricing" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
            {m.common.seePricing}
            <Arrow className="size-4" />
          </Link>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">{m.common.launchUpdates}</p>
          <WaitlistForm source="home" messages={m.waitlist} />
        </div>
      </section>

      {/* 收尾 */}
      <section aria-labelledby="closing-title" className="mt-24 text-center sm:mt-32">
        <h2 id="closing-title" className="text-4xl font-semibold tracking-[-0.03em] text-balance [word-break:auto-phrase] sm:text-5xl">
          {t.closing.title}
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/blocks" className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
            {browseLabel}
            <Arrow className="size-4" />
          </Link>
          <Link href="/pricing" className="inline-flex h-11 items-center rounded-lg px-5 text-[15px] font-medium btn-secondary">
            {m.home.hero.getPro}
          </Link>
        </div>
      </section>
    </>
  );
}


/** 段落開頭只有一層：兩到四個字的標題，右邊可以放一個動作。不加小標、不加說明 */
function SectionHead({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 id={id} className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
