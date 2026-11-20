import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { permanentRedirect } from "next/navigation";

import { AgentSteps } from "@/components/agent-steps";
import { Command } from "@/components/command";
import { HeroCompare } from "@/components/hero-compare";
import { HeroCloud } from "@/components/home/hero-cloud";
import { ClosingCloud, CountUp, MotionBento } from "@/components/home/motion-bento";
import { SceneMarquee, type MarqueeItem } from "@/components/home/scene-marquee";
import { LivePreview } from "@/components/live-preview";
import { WaitlistForm } from "@/components/waitlist-form";
import { buildCatalogItems } from "@/lib/catalog-items";
import { getI18n } from "@/lib/i18n-server";
import { format, type Locale } from "@/lib/i18n";
import { intlLocale } from "@/lib/messages";
import { getItems, installCommand } from "@/lib/registry";
import { foundingState, foundingWindow } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * 首頁（2026-11-20 從零重做）。規則見 SITE-MOTION.md §6，由來見 reports/首頁從零重做深度分析-2026-11-20.md。
 * 一個內容寬度用到底（layout 的 max-w-6xl），只有跑馬燈和開場的背景衝出去。格子一律對齊、等間距、不重疊。
 * 展示的都是真的區塊，而且是挑過的：縮到卡片大小還好看的那些。
 */

// 跑馬燈兩排：有照片、插畫或大塊明暗的區塊。Pro 資料夾不在時那幾個自動略過
const MARQUEE_A = ["depth-hero", "day-night-hero", "compare-slider", "campaign-landing", "card-effects", "lamp-dimmer-scene", "hero-billboard-carousel", "holiday-calendar", "shoppable-lookbook", "cloth-curtain", "sky-time-switch", "specimen-scan", "variant-picker", "glass-cube-hero"];
const MARQUEE_B = ["lookbook-expand-hero", "kelvin-switch", "image-effects", "catalog-flipbook", "loop-shader-hero", "collection-accordion", "book-3d", "gradient-backdrop", "photo-looks", "product-media", "spine-shelf", "curve-rail-hero", "sticker-board", "theme-reveal"];
// 「在這裡直接試」：第一張佔兩格寬，其餘四張等寬
const PLAY = ["depth-hero", "orbit-gallery", "compare-slider", "book-3d", "hotspots"];
// 動效庫格子用到的五套免費動效庫
const MOTION = ["background-effects", "text-effects", "chart-effects", "button-effects", "svg-effects"];
// Pro 場景：每個佔一整排，捲動時一張疊一張。Pro 資料夾不在時整段不出現
const PRO = ["launch-stage-hero", "day-night-hero", "glass-cube-hero", "lookbook-expand-hero"];

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: { absolute: m.home.metaTitle }, description: m.meta.siteDescription };
}

// 型錄搬到 /blocks 之前，篩選與合輯的網址是掛在首頁上的：舊連結帶著這些參數時轉過去
const CATALOG_PARAMS = ["q", "series", "tier", "collection", "saved"];

const SECTION = "mt-28 sm:mt-40";

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
  const pick = (names: string[]) => names.flatMap((name) => items.filter((item) => item.name === name && !("variant" in item)).slice(0, 1));
  const toMarquee = (names: string[]): MarqueeItem[] =>
    pick(names)
      .filter((item) => item.poster)
      .map((item) => ({ name: item.name, title: item.title, pro: item.meta.tier === "pro" }));

  const proCount = all.filter((item) => item.meta.tier === "pro").length;
  const motionCount = all.filter((item) => item.meta.series === "motion").length;
  const firstFree = all.find((item) => item.meta.tier === "free");
  const play = pick(PLAY);
  // 動效庫在型錄裡是一種樣式一張卡，這裡要的是整套的名稱
  const motionLibs = Object.fromEntries(
    MOTION.flatMap((name) => {
      const item = items.find((entry) => entry.name === name);
      return item ? [[name, { name, title: String("libraryTitle" in item ? item.libraryTitle : item.title) }]] : [];
    }),
  );
  const [proLead, ...proRest] = pick(PRO);
  const stats = [all.length, motionCount, proCount, 4];
  const t = m.home.sections;
  const s = m.home.hero.showcase;
  const browseLabel = format(m.home.hero.browse, { n: all.length });
  const previewLabel = (title: string) => format(m.catalog.livePreview, { title });
  const founding = foundingState();
  const day = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric", timeZone: "Asia/Taipei" });
  const chip =
    founding === "closed"
      ? undefined
      : {
          text:
            founding === "upcoming"
              ? format(m.home.hero.chipUpcoming, { opens: day.format(foundingWindow.opensAt) })
              : format(m.home.hero.chipOpen, { closes: day.format(new Date(foundingWindow.closesAt.getTime() - 1)) }),
          href: founding === "upcoming" ? "/pricing#waitlist" : "/pricing",
        };

  return (
    <>
      {/* 開場：標題後面是一整團會轉、會變形、可以拖的點雲（免費區塊 point-cloud）。文字那一層不接事件，讓點雲拖得到 */}
      <section aria-labelledby="home-title" className="relative mx-[calc(50%-50vw)] flex min-h-[max(calc(92svh-3.5rem),640px)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6">
        <div className="absolute top-1/2 left-1/2 aspect-square w-[185vw] max-w-none sm:w-[max(150vh,900px)] -translate-x-1/2 -translate-y-1/2">
          <HeroCloud label={s.cloud} />
        </div>
        {/* 文字後面的暗區：點雲在標題四周，不壓在字上 */}
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 h-[540px] w-[150vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,var(--bg)_62%,transparent)] sm:h-[430px] sm:w-[min(820px,120vw)] sm:bg-[radial-gradient(closest-side,var(--bg)_35%,transparent)]" />
        <div className="pointer-events-none relative [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          {chip && (
            <Link
              href={chip.href}
              className="group inline-flex items-center gap-2 rounded-full bg-card py-1 pr-3 pl-2 text-[13px] font-medium text-subtle shadow-e1 transition-colors hover:text-fg"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-fg" />
              {chip.text}
              <Arrow className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <h1 id="home-title" className="mx-auto mt-7 max-w-4xl text-[clamp(40px,5.4vw,72px)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance [word-break:auto-phrase]">
            {m.home.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-subtle">{m.home.hero.sub}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/blocks" className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
              {browseLabel}
              <Arrow className="size-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-lg px-5 text-[15px] font-medium btn-secondary">
              {m.home.hero.proCta}
            </Link>
          </div>
          {firstFree && (
            <div className="pointer-events-auto mx-auto mt-8 max-w-xl text-left" aria-label={m.home.hero.install}>
              <Command value={installCommand(firstFree)} />
            </div>
          )}
        </div>
        <Link
          href="/blocks/point-cloud"
          className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-card/80 px-3 py-1 font-mono text-[11px] whitespace-nowrap text-subtle shadow-e1 transition-colors hover:text-fg"
        >
          {s.cloudHint}
          <Arrow className="size-3" />
        </Link>
      </section>

      {/* 數字：一排四個 */}
      <section aria-label={m.home.stats.label} className="mt-6 sm:mt-10">
        <dl className="grid grid-cols-2 gap-y-10 border-y border-line py-10 md:grid-cols-4 md:divide-x md:divide-line md:py-12">
          {stats.map((value, i) => (
            <div key={i} className="flex flex-col items-center gap-2 px-4 text-center">
              <dt className="order-2 text-sm text-subtle">{s.stats[i]}</dt>
              <dd className="order-1 text-4xl font-semibold tracking-[-0.03em] tabular-nums sm:text-5xl">
                <CountUp value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 動效庫：每一格是一套免費動效庫正在跑，直接引入元件 */}
      <section aria-labelledby="motion-title" className={SECTION}>
        <SectionHead id="motion-title" title={s.motionTitle} sub={s.motionSub}>
          <Link href="/blocks?series=motion" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium btn-secondary">
            {format(s.motionCta, { n: motionCount })}
            <Arrow className="size-3.5" />
          </Link>
        </SectionHead>
        <MotionBento
          libs={motionLibs}
          note={m.tier.free}
          copy={{ prefix: s.motionPrefix, words: s.motionWords, buttons: s.motionButtons, chart: m.home.hero.wall.chart.title, days: m.home.hero.wall.chart.days }}
        />
      </section>

      {/* 在這裡直接試：真的區塊在跑。上排一大一小，下排三張 */}
      {play.length > 0 && (
        <section aria-labelledby="play-title" className={SECTION}>
          <SectionHead id="play-title" title={s.playTitle} sub={s.playSub}>
            <Link href="/blocks" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium btn-secondary">
              {format(t.catalog.cta, { n: all.length })}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
          <ul className="mt-10 grid gap-x-4 gap-y-8 md:grid-cols-6">
            {play.map((item, i) => (
              <Tile
                key={item.name}
                name={item.name}
                title={item.title}
                note={m.tier[item.meta.tier]}
                poster={item.poster}
                locale={locale}
                previewLabel={previewLabel(item.title)}
                className={i === 0 ? "md:col-span-4" : "md:col-span-2"}
                frame={i < 2 ? "h-[280px] md:h-[440px]" : "h-[280px] md:h-[340px]"}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Pro 場景：一個大框放一整頁的場景，下面三張 */}
      {proLead && (
        <section aria-labelledby="pro-scenes-title" className={SECTION}>
          <SectionHead id="pro-scenes-title" title={t.pro} sub={s.proSub}>
            <Link href="/pricing" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold btn-primary">
              {t.proCta}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
          {/* 每個場景佔一整排，sticky 在頁首下面，下一張往上捲時疊在它上面，露出上一張的標題列 */}
          <ol className="mt-10 space-y-6">
            {[proLead, ...proRest].map((item, i) => (
              <li key={item.name} className="sticky" style={{ top: `calc(4.75rem + ${i * 3.25}rem)` }}>
                <div className="overflow-hidden rounded-2xl bg-card shadow-e2 dark:bg-[#131313]">
                  <div className="flex h-13 items-center justify-between gap-4 border-b border-line px-5 text-sm">
                    <span className="flex items-center gap-3 font-medium">
                      <span className="font-mono text-xs text-subtle tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      {item.title}
                    </span>
                    <Link href={`/blocks/${item.name}`} className="inline-flex items-center gap-1.5 text-subtle transition-colors hover:text-fg">
                      {t.open}
                      <Arrow className="size-3.5" />
                    </Link>
                  </div>
                  <div className="relative h-[min(72svh,660px)]">
                    <LivePreview name={item.name} mode="sheet" title={previewLabel(item.title)} locale={locale} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 差在哪裡：左邊三句話，右邊對照示範 */}
      <section aria-labelledby="compare-title" className={cn(SECTION, "grid items-center gap-x-16 gap-y-10 lg:grid-cols-[1fr_1.1fr]")}>
        <div>
          <h2 id="compare-title" className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            {t.compare}
          </h2>
          <p className="mt-4 max-w-md text-lg text-pretty text-subtle">{s.compareSub}</p>
          <ul className="mt-9 divide-y divide-line border-y border-line">
            {m.home.reasons.map((reason) => (
              <li key={reason.title} className="flex items-center gap-3.5 py-4 text-[15px] font-medium">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {reason.title}
              </li>
            ))}
          </ul>
        </div>
        <div aria-label={m.home.compare.label}>
          <HeroCompare m={{ ...m.home.compare, caption: "" }} />
        </div>
      </section>

      {/* 交給 agent：現成的三步示範（自己帶標題） */}
      <div className="mt-4 sm:mt-16">
        <AgentSteps m={m.home.agent} />
      </div>

      {/* 型錄裡還有更多：兩排真的區塊，往相反方向慢慢走，鋪到螢幕兩邊。
          預覽圖只有深色版，所以這一段固定深色：淺色主題時是一條滿寬的深色帶，深色主題時和頁面同色看不出邊界 */}
      <div className={cn("dark mx-[calc(50%-50vw)] bg-bg text-fg [.light_&]:py-20 sm:[.light_&]:py-24", SECTION)}>
        <section aria-labelledby="catalog-title" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <SectionHead id="catalog-title" title={s.catalogTitle}>
            <Link href="/blocks" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-medium btn-secondary">
              {format(t.catalog.cta, { n: all.length })}
              <Arrow className="size-3.5" />
            </Link>
          </SectionHead>
        </section>
        <section aria-label={s.marquee} className="mt-10 space-y-6">
          <SceneMarquee items={toMarquee(MARQUEE_A)} proLabel={m.tier.pro} />
          <SceneMarquee items={toMarquee(MARQUEE_B)} proLabel={m.tier.pro} reverse />
        </section>
      </div>

      {/* 價格與創始會員 */}
      <section
        aria-labelledby="pro-title"
        className={cn(SECTION, "grid gap-10 rounded-2xl bg-card p-8 shadow-e2 sm:p-12 md:grid-cols-[1.2fr_1fr] md:items-center dark:bg-[#131313]")}
      >
        <div>
          <h2 id="pro-title" className="text-3xl font-semibold tracking-[-0.025em] text-balance [word-break:auto-phrase] sm:text-4xl">
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
      <section aria-labelledby="closing-title" className={cn(SECTION, "text-center")}>
        <ClosingCloud label="SunUI" />
        <h2 id="closing-title" className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-balance [word-break:auto-phrase] sm:text-5xl">
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

/** 段落開頭：靠左的標題、下面一行灰字，右邊最多一個動作 */
function SectionHead({ id, title, sub, children }: { id: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
      <div>
        <h2 id={id} className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          {title}
        </h2>
        {sub && <p className="mt-3 max-w-xl text-lg text-pretty text-subtle">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** 一格：上面是真的區塊在跑，下面一行名稱。frame 是預覽框的高度 */
function Tile({
  name,
  title,
  note,
  poster,
  locale,
  previewLabel,
  className,
  frame,
  mode,
}: {
  name: string;
  title: string;
  note: string;
  poster?: boolean;
  locale: Locale;
  previewLabel: string;
  className?: string;
  frame: string;
  mode?: "card" | "sheet";
}) {
  return (
    <li className={className}>
      <div className={cn("relative overflow-hidden rounded-2xl bg-[#f4f4f4] shadow-e1 dark:bg-[#131313]", frame)}>
        <LivePreview name={name} mode={mode} poster={poster ? `/og/blocks/${name}.jpg` : undefined} title={previewLabel} locale={locale} />
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-4 text-sm">
        <Link href={`/blocks/${name}`} className="truncate font-medium underline-offset-4 hover:underline">
          {title}
        </Link>
        <span className="shrink-0 text-subtle">{note}</span>
      </div>
    </li>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
