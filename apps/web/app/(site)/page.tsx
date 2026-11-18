import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";

import { AgentSteps } from "@/components/agent-steps";
import { BlockCard } from "@/components/block-card";
import { Command } from "@/components/command";
import { HeroCompare } from "@/components/hero-compare";
import { CountUp } from "@/components/home/count-up";
import { HomeHero } from "@/components/home/home-hero";
import { SpecimenTable, type SpecimenKey } from "@/components/home/specimen-table";
import { WaitlistForm } from "@/components/waitlist-form";
import { iconGroups } from "@/lib/icon-groups";
import { buildCatalogItems } from "@/lib/catalog-items";
import { getI18n } from "@/lib/i18n-server";
import { format } from "@/lib/i18n";
import { intlLocale } from "@/lib/messages";
import { getItem, getItems, installCommand } from "@/lib/registry";
import { foundingState, foundingWindow } from "@/lib/site";
import { variantIds } from "@/registry/__generated__/variants";


const COMPAT = ["shadcn CLI", "Next.js", "Vite", "Tailwind CSS v4", "Motion", "Claude Code", "Cursor", "Codex"];
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
  const motionLibs = all.filter((item) => item.meta.series === "motion").length;
  const styleCount = Object.values(variantIds).reduce((n, ids) => n + ids.length, 0);
  const iconCount = iconGroups.reduce((n, group) => n + group.icons.length, 0);
  // 「裡面有什麼」四張卡：數字與連結，順序對應 messages 的 sections.inside.items
  const insideCounts = [all.length, styleCount, iconCount, proCount];
  const insideLinks = ["/blocks", "/docs/motion", "/icons", "/pricing"];
  const picks = PICKS.flatMap((name) => items.filter((item) => item.name === name && !("variant" in item)).slice(0, 1));
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
        sub={format(m.home.hero.sub, { n: all.length })}
        primary={{ label: m.common.browseBlocks, href: "/blocks" }}
        secondary={{ label: m.home.hero.proCta, href: "/pricing" }}
        command={firstFree && <Command value={installCommand(firstFree)} />}
        table={<SpecimenTable copy={m.home.hero.specimens} links={specimenLinks} />}
      />

      {/* 相容性：只有文字，不放商標圖 */}
      <section aria-label={t.compat} className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-line py-5 text-sm text-subtle lg:mt-0">
        <span className="font-medium text-fg">{t.compat}</span>
        {COMPAT.map((name) => (
          <span key={name} className="font-mono text-[13px]">
            {name}
          </span>
        ))}
      </section>

      {/* 裡面有什麼：四個數字 */}
      <section aria-labelledby="inside-title" className="mt-28 sm:mt-36">
        <SectionHead id="inside-title" eyebrow={t.inside.eyebrow} title={t.inside.title} />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.inside.items.map((item, i) => (
            <Link
              key={item.label}
              href={insideLinks[i]}
              className="group flex flex-col rounded-xl bg-card p-6 shadow-e1 transition-shadow duration-200 hover:shadow-e2"
            >
              <CountUp value={insideCounts[i]} className="text-5xl font-semibold tracking-[-0.04em] tabular-nums" />
              <span className="mt-4 flex items-center gap-1.5 font-medium">
                {item.label}
                <Arrow className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
              </span>
              <span className="mt-1.5 text-sm text-pretty text-subtle">{format(item.body, { n: motionLibs })}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pro 場景：旗艦，即時預覽 */}
      {showcase.length > 0 && (
        <section aria-labelledby="showcase-title" className="mt-28 sm:mt-36">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead id="showcase-title" eyebrow={t.showcase.eyebrow} title={t.showcase.title} body={t.showcase.body} />
            <Link href="/pricing" className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold btn-primary">
              {t.showcase.cta}
              <Arrow className="size-4" />
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((item) => (
              <BlockCard
                key={item.name}
                name={item.name}
                title={item.title}
                tier="pro"
                spot={item.spot ? "ink" : undefined}
                poster={item.poster}
                locale={locale}
                labels={{ livePreview: m.catalog.livePreview, expand: m.catalog.expand, pro: m.tier.pro }}
              />
            ))}
          </ul>
        </section>
      )}

      {/* 比較示範加三個理由 */}
      <section aria-labelledby="compare-title" className="mt-28 sm:mt-36">
        <SectionHead id="compare-title" eyebrow={t.compare.eyebrow} title={t.compare.title} center />
        <div aria-label={m.home.compare.label} className="mx-auto mt-10 max-w-xl">
          <HeroCompare m={m.home.compare} />
        </div>
        <dl className="mt-14 grid gap-x-10 gap-y-8 border-t border-line pt-10 md:grid-cols-3">
          {m.home.reasons.map((reason) => (
            <div key={reason.title}>
              <dt className="font-medium">{reason.title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-pretty text-subtle">{reason.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <AgentSteps m={m.home.agent} />

      {/* 價格與創始會員 */}
      <section
        aria-labelledby="pro-title"
        className="mt-28 grid gap-10 rounded-2xl bg-card p-8 shadow-e2 sm:mt-36 sm:p-12 md:grid-cols-[1.2fr_1fr] md:items-center"
      >
        <div>
          <p className="text-sm font-medium text-subtle">{m.home.proEyebrow}</p>
          <h2 id="pro-title" className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
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

      {/* 九張精選：完整型錄在 /blocks */}
      <section aria-labelledby="picks-title" className="mt-28 sm:mt-36">
        <SectionHead id="picks-title" eyebrow={t.catalog.eyebrow} title={t.catalog.picksTitle} body={t.catalog.picksBody} />
        <ul className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((item) => (
            <BlockCard
              key={item.name}
              name={item.name}
              title={item.title}
              tier={item.meta.tier}
              spot={item.spot ? "ink" : undefined}
              poster={item.poster}
              locale={locale}
              labels={{ livePreview: m.catalog.livePreview, expand: m.catalog.expand, pro: m.tier.pro }}
            />
          ))}
        </ul>
        <div className="mt-12 flex justify-center">
          <Link href="/blocks" className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-medium btn-secondary">
            {format(t.catalog.cta, { n: all.length })}
            <Arrow className="size-4" />
          </Link>
        </div>
      </section>

      {/* 收尾 */}
      <section aria-labelledby="closing-title" className="mt-28 text-center sm:mt-36">
        <h2 id="closing-title" className="text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          {t.closing.title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-pretty text-subtle">{t.closing.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/blocks" className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
            {m.common.browseBlocks}
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


function SectionHead({ id, eyebrow, title, body, center }: { id?: string; eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-medium text-subtle">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[1.1]">
        {title}
      </h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-pretty text-subtle">{body}</p>}
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
