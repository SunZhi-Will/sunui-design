import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { permanentRedirect } from "next/navigation";

import { BlockCard } from "@/components/block-card";
import { Command } from "@/components/command";
import { HeroCompare } from "@/components/hero-compare";
import { HomeHero } from "@/components/home/home-hero";
import { LiveWall } from "@/components/home/live-wall";
import { WaitlistForm } from "@/components/waitlist-form";
import { buildCatalogItems } from "@/lib/catalog-items";
import { getI18n } from "@/lib/i18n-server";
import { format } from "@/lib/i18n";
import { intlLocale } from "@/lib/messages";
import { getItems, installCommand } from "@/lib/registry";
import { foundingState, foundingWindow } from "@/lib/site";


// 「交給 agent」那一段展示的成果：一句話之後裝好的三個區塊
// 開場以下的展示段落和元件牆一樣鋪滿寬度；內層上限和牆相同
const WIDE_INNER = "mx-auto max-w-[2400px]";
// 第五欄的斷點寫成 rem（106.25rem = 1700px）：用 px 的話和內建的 rem 斷點比不出先後，會被 xl 的四欄蓋掉。
// 展示格線一列的欄數是 1、2、3、4、5；傳 10 張卡，各欄數下顯示 6、8、9、8、10 張，每一列都排滿
function showAt(i: number) {
  if (i < 6) return undefined;
  if (i < 8) return "hidden sm:block";
  if (i === 8) return "hidden lg:block xl:hidden min-[106.25rem]:block";
  return "hidden min-[106.25rem]:block";
}

const AGENT_RESULT = ["countdown-banner", "coupon-claim-card", "free-shipping-progress"];
// 首頁展示的 Pro 場景：挑一個動作就有大變化、畫面最完整的。Pro 資料夾不在時整段不出現
const SHOWCASE = ["kelvin-switch", "lamp-dimmer-scene", "theme-reveal", "glass-cube-hero", "launch-stage-hero", "curve-rail-hero", "checkout-flow", "cart-drawer", "order-island", "day-night-hero"];
// 首頁的免費精選：一按就有反應的。張數與 showAt 配合，各欄數下都排滿
const PICKS = ["add-to-cart-button", "depth-hero", "orbit-gallery", "checkout-steps", "animated-number", "theme-picker", "quantity-stepper", "hotspots", "compare-slider", "expanding-search"];
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
      {/* 開場：一個畫面高的舞台，大標題加可以拖的太陽；下面是鋪滿螢幕寬度的即時元件牆 */}
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
        sun={m.home.hero.sun}
        wall={<LiveWall copy={m.home.hero.wall} command={firstFree && <Command value={installCommand(firstFree)} />} />}
      />

      {/* 免費區塊：開場正下方就是可以按的東西 */}
      <section aria-labelledby="free-title" className="mx-[calc(50%-50vw)] px-4 sm:px-5 mt-16 sm:mt-24">
        <div className={WIDE_INNER}>
        <SectionHead id="free-title" title={t.free}>
          <Link href="/blocks" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium btn-secondary">
            {format(t.catalog.cta, { n: all.length })}
            <Arrow className="size-3.5" />
          </Link>
        </SectionHead>
        <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[106.25rem]:grid-cols-5">
          {picks.map((item, i) => (
              <BlockCard
                key={item.name}
                name={item.name}
                title={item.title}
                tier={item.meta.tier}
                spot={item.spot ? "ink" : undefined}
                poster={item.poster}
                locale={locale}
                labels={cardLabels}
                className={showAt(i)}
              />
          ))}
        </ul>
        </div>
      </section>

      {/* Pro 場景 */}
      {showcase.length > 0 && (
        <section aria-labelledby="pro-scenes-title" className="mx-[calc(50%-50vw)] px-4 sm:px-5 mt-24 sm:mt-32">
          <div className={WIDE_INNER}>
          <SectionHead id="pro-scenes-title" title={t.pro}>
            <Link href="/pricing" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold btn-primary">
              {t.proCta}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
          <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[106.25rem]:grid-cols-5">
            {showcase.map((item, i) => (
                <BlockCard
                  key={item.name}
                  name={item.name}
                  title={item.title}
                  tier={item.meta.tier}
                  spot={item.spot ? "ink" : undefined}
                  poster={item.poster}
                  locale={locale}
                  labels={cardLabels}
                  className={showAt(i)}
                />
            ))}
          </ul>
          </div>
        </section>
      )}

      {/* 比較示範：只留示範本身 */}
      <section aria-labelledby="compare-title" className="mt-24 sm:mt-32">
        <h2 id="compare-title" className="text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          {t.compare}
        </h2>
        <div aria-label={m.home.compare.label} className="mx-auto mt-8 max-w-2xl">
          <HeroCompare m={{ ...m.home.compare, caption: "" }} />
        </div>
      </section>

      {/* 交給 agent：一句話進去，裝好的區塊出來 */}
      {agentBlocks.length > 0 && (
        <section aria-labelledby="agent-title" className="mx-[calc(50%-50vw)] px-4 sm:px-5 mt-24 sm:mt-32">
          <div className={WIDE_INNER}>
          <SectionHead id="agent-title" title={t.agent.title}>
            <Link href="/docs/ai-agents" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium btn-secondary">
              {m.home.agent.docs}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
          <ul className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[106.25rem]:grid-cols-5">
            {/* 第一格是那一句話，後面是它裝好的區塊；最寬的版面這一格佔兩欄 */}
            <li className="flex aspect-[5/4] flex-col justify-between rounded-xl bg-card p-6 shadow-e1 sm:col-span-2 sm:aspect-auto lg:col-span-3 xl:col-span-1 min-[106.25rem]:col-span-2 dark:bg-[#151515]">
              <p className="max-w-full self-start rounded-2xl rounded-bl-md bg-fg px-4 py-2.5 text-lg font-medium text-bg">{t.agent.prompt}</p>
              <p className="mt-6 flex items-center gap-2 font-mono text-[13px] text-subtle">
                <svg viewBox="0 0 24 24" className="size-4 text-fg" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {format(t.agent.result, { n: agentBlocks.length })}
              </p>
            </li>
            {agentBlocks.map((item, i) => (
                <BlockCard
                  key={item.name}
                  name={item.name}
                  title={item.title}
                  tier={item.meta.tier}
                  spot={item.spot ? "ink" : undefined}
                  poster={item.poster}
                  locale={locale}
                  labels={cardLabels}
                  className={i === agentBlocks.length - 1 ? "sm:max-lg:col-span-2" : undefined}
                />
            ))}
          </ul>
          </div>
        </section>
      )}

      {/* 價格與創始會員 */}
      <section
        aria-labelledby="pro-title"
        className="mx-auto mt-24 grid max-w-5xl gap-10 rounded-2xl bg-card p-8 shadow-e2 sm:mt-32 sm:p-12 md:grid-cols-[1.2fr_1fr] md:items-center dark:bg-[#151515]"
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
