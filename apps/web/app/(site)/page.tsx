import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { permanentRedirect } from "next/navigation";

import { AgentSteps } from "@/components/agent-steps";
import { Command } from "@/components/command";
import { HeroCompare } from "@/components/hero-compare";
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
// Pro 場景：第一個放大框，其餘三張。Pro 資料夾不在時整段不出現
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
      {/* 開場：置中的標題、一句話、兩顆按鈕、安裝指令。背景是很淡的格線，從上往下淡出 */}
      <section aria-labelledby="home-title" className="relative isolate pt-16 text-center sm:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-[calc(50%-50vw)] h-[640px] bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[size:64px_64px] bg-center [mask-image:radial-gradient(ellipse_55%_80%_at_50%_0%,#000_20%,transparent_72%)]"
        />
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
          <div className="mx-auto mt-8 max-w-xl text-left" aria-label={m.home.hero.install}>
            <Command value={installCommand(firstFree)} />
          </div>
        )}
      </section>

      {/* 區塊跑馬燈：兩排真的區塊，往相反方向慢慢走，鋪到螢幕兩邊 */}
      <section aria-label={s.marquee} className="mx-[calc(50%-50vw)] mt-16 space-y-6 sm:mt-20">
        <SceneMarquee items={toMarquee(MARQUEE_A)} proLabel={m.tier.pro} />
        <SceneMarquee items={toMarquee(MARQUEE_B)} proLabel={m.tier.pro} reverse />
      </section>

      {/* 數字：一排四個 */}
      <section aria-label={m.home.stats.label} className="mt-20 sm:mt-28">
        <dl className="grid grid-cols-2 gap-y-10 border-y border-line py-10 md:grid-cols-4 md:divide-x md:divide-line md:py-12">
          {stats.map((value, i) => (
            <div key={i} className="flex flex-col items-center gap-2 px-4 text-center">
              <dt className="order-2 text-sm text-subtle">{s.stats[i]}</dt>
              <dd className="order-1 text-4xl font-semibold tracking-[-0.03em] tabular-nums sm:text-5xl">{value}</dd>
            </div>
          ))}
        </dl>
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
                frame={i < 2 ? "h-[340px] md:h-[440px]" : "h-[340px]"}
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
          <ul className="mt-10 grid gap-x-4 gap-y-8 md:grid-cols-3">
            <Tile
              name={proLead.name}
              title={proLead.title}
              note={m.tier.pro}
              locale={locale}
              previewLabel={previewLabel(proLead.title)}
              className="md:col-span-3"
              frame="h-[520px] md:h-[640px]"
              mode="sheet"
            />
            {proRest.map((item) => (
              <Tile
                key={item.name}
                name={item.name}
                title={item.title}
                note={m.tier.pro}
                poster={item.poster}
                locale={locale}
                previewLabel={previewLabel(item.title)}
                frame="h-[340px]"
              />
            ))}
          </ul>
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
      <div className={cn("relative overflow-hidden rounded-2xl bg-card shadow-e1 dark:bg-[#131313]", frame)}>
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
