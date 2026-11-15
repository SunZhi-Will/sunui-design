import type { Metadata } from "next";
import Link from "next/link";

import { SavingsCalculator } from "@/components/savings-calculator";
import { ViewBeacon } from "@/components/view-beacon";
import { WaitlistForm } from "@/components/waitlist-form";
import { getI18n } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getItems } from "@/lib/registry";
import { seriesOf } from "@/lib/series";
import { checkoutCopy } from "@/lib/checkout-copy";
import { anyCheckoutReady, paymentOptions } from "@/lib/payments";
import { foundingState, foundingWindow, planPrice, prices, pricesTwd } from "@/lib/site";
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
  // SHOPLINE 設定好才開放結帳；否則按鈕導到 waitlist
  const canBuy = anyCheckoutReady();
  const pay = paymentOptions();
  const proCount = getItems("pro").length;
  const freeItems = getItems("free");
  // 動效庫一組含十幾種效果，和一般 block 分開列（見 reports/免費與付費切分規劃-2026-11-05.md）
  const motionCount = freeItems.filter((item) => seriesOf(item) === "motion").length;
  const freeCount = freeItems.length - motionCount;
  // 開賣前整頁只留一個候補表單：創始方案區塊有表單時用它，否則才在下方放一個
  const foundingHasForm = state !== "closed" && !(state === "open" && canBuy);
  // 還不能結帳的方案按鈕寫出開賣日，點了捲到那唯一的表單，而不是再放一個一樣的「加入候補名單」
  const waitlistCta =
    state === "upcoming"
      ? { label: t.opensCta(dateFormat.format(foundingWindow.opensAt)), href: "#waitlist" }
      : { label: t.joinWaitlist, href: "#waitlist" };

  // 以台幣收款：每個付費方案同時列台幣與美金，繁中以台幣為主
  const proPrice = planPrice("pro", locale);
  const teamPrice = planPrice("team", locale);
  const foundingPrice = planPrice("founding", locale);
  const { billedInTwd, billedBoth, chargedInUsd, priceGuard, subscribe: sub, planName } = checkoutCopy(locale);
  // 收款說明：兩種幣別都開時講清楚海外卡付美金；只有 Polar 時講美金；否則維持新台幣
  const billingNote = pay.twd && pay.usd ? billedBoth : pay.usd ? chargedInUsd : billedInTwd;

  // 訂閱（預付期間制，不自動續扣）。年訂省多少依介面主要幣別計算，和畫面上的數字對得起來
  const yearlySave =
    locale === "zh-TW"
      ? Math.round((1 - pricesTwd.yearly / (pricesTwd.monthly * 12)) * 100)
      : Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100);
  const subscriptionPlans = [
    {
      key: "monthly" as const,
      name: planName.monthly,
      price: planPrice("monthly", locale),
      per: sub.perMonth,
      note: sub.monthlyNote,
      badge: undefined as string | undefined,
      cta: canBuy ? { label: sub.cta, href: "/go/checkout/monthly" } : waitlistCta,
    },
    {
      key: "yearly" as const,
      name: planName.yearly,
      price: planPrice("yearly", locale),
      per: sub.perYear,
      note: sub.yearlyNote,
      badge: sub.yearlySave(yearlySave),
      cta: canBuy ? { label: sub.cta, href: "/go/checkout/yearly" } : waitlistCta,
    },
  ];

  const plans = [
    {
      name: t.free.name,
      price: locale === "zh-TW" ? "NT$0" : "$0",
      secondary: undefined as string | undefined,
      note: t.free.note,
      features: t.free.features(freeCount, motionCount),
      cta: { label: m.common.browseBlocks, href: "/" },
    },
    {
      name: t.pro.name,
      price: proPrice.primary,
      secondary: proPrice.secondary,
      note: t.pro.note,
      highlight: true,
      // 主方案卡也要看得到訂閱入口，不然想先試用的人要滑很久才找到
      subscribeLink: sub.orMonthly(planPrice("monthly", locale).primary),
      // 創始會員開賣前賣 Pro 買斷：保證開賣後可退差價，買的人不會覺得被坑
      guard:
        canBuy && state === "upcoming"
          ? priceGuard(dateFormat.format(foundingWindow.opensAt), planPrice("founding", locale).primary)
          : undefined,
      features: t.pro.features,
      cta: canBuy ? { label: t.pro.cta, href: "/go/checkout/pro" } : waitlistCta,
    },
    {
      name: t.team.name,
      price: teamPrice.primary,
      secondary: teamPrice.secondary,
      note: t.team.note,
      features: t.team.features,
      cta: canBuy ? { label: t.team.cta, href: "/go/checkout/team" } : waitlistCta,
    },
  ];

  return (
    <div className="py-16 sm:py-20">
      <ViewBeacon event="pricing_view" />
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
          <p className="mt-1 text-sm text-subtle tabular-nums">
            ≈ {foundingPrice.secondary}
          </p>
          <p className="mt-2 text-sm text-subtle">
            {state === "upcoming"
              ? t.foundingUpcoming(
                  dateFormat.format(foundingWindow.opensAt),
                  dateFormat.format(new Date(foundingWindow.closesAt.getTime() - 1)),
                )
              : t.foundingOpen(dateFormat.format(new Date(foundingWindow.closesAt.getTime() - 1)))}
          </p>
          <div className="mt-5 max-w-md">
            {state === "open" && canBuy ? (
              <a
                href="/go/checkout/founding"
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
              // 手機上單欄堆疊時 Pro 排第一，付費的人不用先滑過免費方案
              plan.highlight ? "border-fg max-md:order-first" : "border-line",
            )}
          >
            <h2 className="font-medium">{plan.name}</h2>
            {/* 價格獨立一行：說明放在旁邊時，三欄的寬度會把它擠成一欄兩個字的直排 */}
            <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">{plan.price}</p>
            <p className="mt-1.5 text-sm text-pretty text-subtle tabular-nums">
              {plan.secondary && <>≈ {plan.secondary} · </>}
              {plan.note}
            </p>
            {"guard" in plan && plan.guard && <p className="mt-2 text-xs text-pretty text-subtle">{plan.guard}</p>}
            {"subscribeLink" in plan && plan.subscribeLink && (
              <a href="#subscribe" className="mt-1 self-start text-sm text-subtle underline decoration-line underline-offset-4 hover:text-fg">
                {plan.subscribeLink}
              </a>
            )}
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
            {/* 結帳走 /go/checkout 計數後轉到結帳頁：用一般連結，Link 的預先載入會把瀏覽也算成點擊 */}
            {(() => {
              const className = cn(
                "mt-8 rounded-md px-4 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90",
                plan.highlight ? "bg-fg text-bg" : "border border-line",
              );
              return plan.cta.href.startsWith("/go/") ? (
                <a href={plan.cta.href} className={className}>
                  {plan.cta.label}
                </a>
              ) : (
                <Link href={plan.cta.href} className={className}>
                  {plan.cta.label}
                </Link>
              );
            })()}
          </div>
        ))}
      </section>

      <section id="subscribe" aria-labelledby="subscribe-title" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="text-center">
          <h2 id="subscribe-title" className="text-xl font-semibold tracking-tight">
            {sub.title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-pretty text-subtle">{sub.lead}</p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {subscriptionPlans.map((plan) => (
            <div key={plan.key} className="flex flex-col rounded-lg border border-line bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{plan.name}</h3>
                {plan.badge && (
                  <span className="rounded-full border border-accent/40 px-2 py-0.5 text-xs font-medium text-accent">{plan.badge}</span>
                )}
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{plan.price.primary}</span>
                <span className="text-sm text-subtle">{plan.per}</span>
              </p>
              <p className="mt-1 text-sm text-subtle tabular-nums">
                ≈ {plan.price.secondary} · {plan.note}
              </p>
              <a
                href={plan.cta.href}
                className="mt-6 rounded-md border border-line px-4 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90"
              >
                {plan.cta.label}
              </a>
            </div>
          ))}
        </div>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-subtle">
          {sub.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span aria-hidden="true" className="text-accent">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-center text-sm text-subtle">
        {t.footnote(proCount)}
      </p>
      <p className="mt-1.5 text-center text-xs text-subtle">{billingNote}</p>

      <SavingsCalculator price={prices.pro} locale={locale} t={t.calculator} />

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
