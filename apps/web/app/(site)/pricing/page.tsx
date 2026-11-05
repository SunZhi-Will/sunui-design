import type { Metadata } from "next";
import Link from "next/link";

import { WaitlistForm } from "@/components/waitlist-form";
import { getI18n } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getItems } from "@/lib/registry";
import { seriesOf } from "@/lib/series";
import { checkoutUrls, foundingState, foundingWindow, prices } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.pricing.metaTitle, description: m.pricing.metaDescription };
}

// Founding member 的開賣狀態依日期變化，每小時重新產生
export const revalidate = 3600;

export default async function PricingPage() {
  const { locale, m } = await getI18n();
  const t = m.pricing;
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric", timeZone: "Asia/Taipei" });
  const state = foundingState();
  const proCount = getItems("pro").length;
  const freeItems = getItems("free");
  // 動效庫一組含十幾種效果，和一般 block 分開列（見 reports/免費與付費切分規劃-2026-11-05.md）
  const motionCount = freeItems.filter((item) => seriesOf(item) === "motion").length;
  const freeCount = freeItems.length - motionCount;
  // 開賣前整頁只留一個候補表單：創始方案區塊有表單時用它，否則才在下方放一個
  const foundingHasForm = state !== "closed" && !(state === "open" && checkoutUrls.founding);
  // 還不能結帳的方案按鈕寫出開賣日，點了捲到那唯一的表單，而不是再放一個一樣的「加入候補名單」
  const waitlistCta =
    state === "upcoming"
      ? { label: t.opensCta(dateFormat.format(foundingWindow.opensAt)), href: "#waitlist" }
      : { label: t.joinWaitlist, href: "#waitlist" };

  const plans = [
    {
      name: t.free.name,
      price: "$0",
      note: t.free.note,
      features: t.free.features(freeCount, motionCount),
      cta: { label: m.common.browseBlocks, href: "/" },
    },
    {
      name: t.pro.name,
      price: `$${prices.pro}`,
      note: t.pro.note,
      highlight: true,
      features: t.pro.features,
      cta: checkoutUrls.pro ? { label: t.pro.cta, href: checkoutUrls.pro } : waitlistCta,
    },
    {
      name: t.team.name,
      price: `$${prices.team}`,
      note: t.team.note,
      features: t.team.features,
      cta: checkoutUrls.team ? { label: t.team.cta, href: checkoutUrls.team } : waitlistCta,
    },
  ];

  return (
    <div className="py-16 sm:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg text-pretty text-subtle">{t.lead}</p>
      </header>

      {state !== "closed" && (
        <section
          id={foundingHasForm ? "waitlist" : undefined}
          aria-labelledby="founding-title"
          className="mx-auto mt-12 max-w-3xl scroll-mt-24 rounded-lg border border-fg/80 bg-card p-6 sm:p-8"
        >
          <p className="text-sm font-medium text-accent">{t.foundingEyebrow}</p>
          <h2 id="founding-title" className="mt-1 text-2xl font-semibold tracking-tight">
            {t.foundingTitle(foundingWindow.seats)}
          </h2>
          <p className="mt-2 text-sm text-subtle">
            {state === "upcoming"
              ? t.foundingUpcoming(
                  dateFormat.format(foundingWindow.opensAt),
                  dateFormat.format(new Date(foundingWindow.closesAt.getTime() - 1)),
                )
              : t.foundingOpen(dateFormat.format(new Date(foundingWindow.closesAt.getTime() - 1)))}
          </p>
          <div className="mt-5 max-w-md">
            {state === "open" && checkoutUrls.founding ? (
              <a
                href={checkoutUrls.founding}
                className="inline-flex rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                {t.foundingCta}
              </a>
            ) : (
              <WaitlistForm source="pricing-founding" messages={m.waitlist} />
            )}
          </div>
        </section>
      )}

      <section aria-label={t.plansLabel} className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "flex flex-col rounded-lg border bg-card p-6",
              plan.highlight ? "border-fg" : "border-line",
            )}
          >
            <h2 className="font-medium">{plan.name}</h2>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-sm text-subtle">{plan.note}</span>
            </p>
            <ul className="mt-6 grid flex-1 content-start gap-2.5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={cn(
                "mt-8 rounded-md px-4 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90",
                plan.highlight ? "bg-fg text-bg" : "border border-line",
              )}
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </section>

      <p className="mt-6 text-center text-sm text-subtle">
        {t.footnote(proCount)}
      </p>

      {!foundingHasForm && (
        <section id="waitlist" aria-labelledby="waitlist-title" className="mx-auto mt-20 max-w-md scroll-mt-24 text-center">
          <h2 id="waitlist-title" className="text-xl font-semibold tracking-tight">
            {m.common.launchUpdates}
          </h2>
          <p className="mt-2 mb-5 text-sm text-subtle">{t.waitlistBody}</p>
          <WaitlistForm source="pricing" messages={m.waitlist} />
        </section>
      )}

      <section aria-labelledby="faq-title" className="mx-auto mt-20 max-w-2xl">
        <h2 id="faq-title" className="mb-6 text-xl font-semibold tracking-tight">
          {t.faqTitle}
        </h2>
        <dl className="grid gap-6 text-sm">
          {t.faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-medium">{faq.q}</dt>
              <dd className="mt-1.5 text-pretty text-subtle">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
