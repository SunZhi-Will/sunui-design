import type { Metadata } from "next";

import { PlanCompare, type CompareRow } from "@/components/plan-compare";
import { type Plan, PricingPlans } from "@/components/pricing-plans";
import { SavingsCalculator } from "@/components/savings-calculator";
import { ViewBeacon } from "@/components/view-beacon";
import { WaitlistForm } from "@/components/waitlist-form";
import { getI18n } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getItems } from "@/lib/registry";
import { seriesOf } from "@/lib/series";
import { checkoutCopy } from "@/lib/checkout-copy";
import { anyCheckoutReady, paymentOptions } from "@/lib/payments";
import { shoplineRecurringReady } from "@/lib/shopline";
import {
  foundingState,
  foundingWindow,
  planPrice,
  prices,
  pricesTwd,
} from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 價格頁的金額色調（2026-11-20）。blue：靛藍到青色（使用中）；gold：金色（淺色模式試過不好看，2026-11-20 切回 blue）。改這一行就能切換。
 * 淺色模式用較深的色階，白底上才讀得清楚；深色模式用較亮的色階。
 */
const PRICE_TONE: keyof typeof PRICE_TONES = "blue";
const PRICE_TONES = {
  // 金色在白底上偏暗就變成土褐色，所以淺色模式用飽和的黃金、由上往下的金箔漸層，卡片底光只留極淡一層
  gold: "[--price-angle:180deg] [--price-a:#e0a91b] [--price-b:#b8820a] [--tone:#d4a020] [--tone-fg:#3d2a02] [--tone-glow:rgb(224_169_27/0.07)] [--save:#059669] dark:[--price-a:#f5d78e] dark:[--price-b:#c8a050] dark:[--tone:#d9b25f] dark:[--tone-fg:#0a0a0a] dark:[--tone-glow:rgb(245_215_142/0.1)] dark:[--save:#34d399]",
  blue: "[--price-angle:135deg] [--price-a:#4f46e5] [--price-b:#0284c7] [--tone:#4f46e5] [--tone-fg:#ffffff] [--tone-glow:rgb(79_70_229/0.08)] [--save:#059669] dark:[--price-a:#a5b4fc] dark:[--price-b:#67e8f9] dark:[--tone:#a5b4fc] dark:[--tone-fg:#0a0a0a] dark:[--tone-glow:rgb(165_180_252/0.12)] dark:[--save:#34d399]",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.pricing.metaTitle, description: m.pricing.metaDescription };
}

// Founding member 的開賣狀態依日期變化，每小時重新產生
export const revalidate = 3600;

export default async function PricingPage() {
  const { locale, m } = await getI18n();
  const t = m.pricing;
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Taipei",
  });
  const state = foundingState();
  // SHOPLINE 設定好才開放結帳；否則按鈕導到 waitlist
  const canBuy = anyCheckoutReady();
  const pay = paymentOptions();
  // 訂閱要能綁卡自動扣款：新台幣要有 SHOPLINE_CLIENT_KEY（內嵌式 SDK），美金要有 Polar；都沒有時訂閱按鈕導到候補，不要點了才被擋
  const canSubscribe = (pay.twd && shoplineRecurringReady()) || pay.usd;
  const proCount = getItems("pro").length;
  const freeItems = getItems("free");
  // 動效庫一組含十幾種效果，和一般 block 分開列（見 reports/免費與付費切分規劃-2026-11-05.md）
  const motionCount = freeItems.filter(
    (item) => seriesOf(item) === "motion",
  ).length;
  const freeCount = freeItems.length - motionCount;
  // 開賣前整頁只留一個候補表單：創始方案區塊有表單時用它，否則才在下方放一個
  const foundingHasForm = state !== "closed" && !(state === "open" && canBuy);
  // 還不能結帳的方案按鈕寫出開賣日，點了捲到那唯一的表單，而不是再放一個一樣的「加入候補名單」
  const waitlistCta =
    state === "upcoming"
      ? {
          label: t.opensCta(dateFormat.format(foundingWindow.opensAt)),
          href: "#waitlist",
        }
      : { label: t.joinWaitlist, href: "#waitlist" };

  // 以台幣收款：每個付費方案同時列台幣與美金，繁中以台幣為主
  const proPrice = planPrice("pro", locale);
  const teamPrice = planPrice("team", locale);
  const foundingPrice = planPrice("founding", locale);
  const {
    billedInTwd,
    billedBoth,
    chargedInUsd,
    priceGuard,
    subscribe: sub,
    planName,
  } = checkoutCopy(locale);
  // 收款說明：兩種幣別都開時講清楚海外卡付美金；只有 Polar 時講美金；否則維持新台幣
  const billingNote =
    pay.twd && pay.usd ? billedBoth : pay.usd ? chargedInUsd : billedInTwd;

  // 訂閱（預付期間制，不自動續扣）。年訂省多少依介面主要幣別計算，和畫面上的數字對得起來
  const yearlySave =
    locale === "zh-TW"
      ? Math.round((1 - pricesTwd.yearly / (pricesTwd.monthly * 12)) * 100)
      : Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100);
  const freePlan: Plan = {
    name: t.free.name,
    price: locale === "zh-TW" ? "NT$0" : "$0",
    note: t.free.note,
    features: t.free.features(freeCount, motionCount),
    cta: { label: m.common.browseBlocks, href: "/blocks" },
  };
  // 訂閱的功能：訂閱特有的三條（到期後照常可用、同信箱續訂），加上 Pro 的私有 registry 與不限專案數
  const subscriptionFeatures = [...sub.features, t.pro.features[2], t.pro.features[3]];
  const monthly = planPrice("monthly", locale);
  const yearly = planPrice("yearly", locale);
  const subscriptionCards: Plan[] = [
    freePlan,
    {
      name: planName.monthly,
      price: monthly.primary,
      per: sub.perMonth,
      secondary: monthly.secondary,
      note: sub.monthlyNote,
      features: subscriptionFeatures,
      cta: canSubscribe ? { label: sub.cta, href: "/go/checkout/monthly" } : waitlistCta,
    },
    {
      name: planName.yearly,
      price: yearly.primary,
      per: sub.perYear,
      secondary: yearly.secondary,
      note: sub.yearlyNote,
      badge: sub.yearlySave(yearlySave),
      highlight: true,
      features: subscriptionFeatures,
      cta: canSubscribe ? { label: sub.cta, href: "/go/checkout/yearly" } : waitlistCta,
    },
  ];

  const oneTimeCards: Plan[] = [
    freePlan,
    {
      name: t.pro.name,
      price: proPrice.primary,
      secondary: proPrice.secondary,
      note: t.pro.note,
      highlight: true,
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

  // 方案比較表：五個方案並排，順序和切換鈕一致（訂閱在前、買斷在後）
  const cmp = t.compare;
  const v = cmp.values;
  const compareColumns = [
    { name: t.free.name, price: freePlan.price },
    { name: planName.monthly, price: monthly.primary, per: sub.perMonth },
    { name: planName.yearly, price: yearly.primary, per: sub.perYear, highlight: true },
    { name: t.pro.name, price: proPrice.primary, highlight: true },
    { name: t.team.name, price: teamPrice.primary },
  ];
  const compareRows: CompareRow[] = [
    { label: cmp.rows.billing, cells: [v.free, v.monthly, v.yearly, v.once, v.once] },
    { label: cmp.rows.seats, cells: [v.anyone, "1", "1", "1", String(prices.teamSeats)] },
    { label: cmp.rows.freeBlocks, cells: [true, true, true, true, true] },
    { label: cmp.rows.proBlocks, cells: [false, true, true, true, true] },
    { label: cmp.rows.future, cells: [false, v.whileActive, v.whileActive, v.forever, v.forever] },
    { label: cmp.rows.registry, cells: [false, true, true, true, true] },
    { label: cmp.rows.projects, cells: [true, true, true, true, true] },
    { label: cmp.rows.term, cells: [v.mit, v.afterEnd, v.afterEnd, v.forever, v.forever] },
    { label: cmp.rows.keySwap, cells: [false, false, false, false, true] },
    { label: cmp.rows.support, cells: [false, false, false, false, true] },
  ];

  const closesLabel = dateFormat.format(
    new Date(foundingWindow.closesAt.getTime() - 1),
  );

  return (
    <div
      // 價格頁例外：金額要一眼看得出來，所以數字用 PRICE_TONE 的漸層、省下的錢用綠色。按鈕與外殼仍維持黑白灰
      className={cn("relative pt-16 pb-24 sm:pt-24", PRICE_TONES[PRICE_TONE])}
    >
      <ViewBeacon event="pricing_view" />

      {/* 頂部一圈極淡的光：只有明度變化，不帶色相（站台只用黑白灰） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 -z-10 mx-auto h-[420px] max-w-4xl bg-[radial-gradient(closest-side,var(--line-strong),transparent)] opacity-70 blur-2xl"
      />

      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-subtle">
          {t.lead}
        </p>
      </header>

      {/* 創始會員放在方案上方：限時、限量、開賣前唯一能做的動作（候補），所以先看到 */}
      {state !== "closed" && (
        <section
          id={foundingHasForm ? "waitlist" : undefined}
          aria-labelledby="founding-title"
          className="relative mx-auto mt-12 max-w-6xl scroll-mt-24 overflow-hidden rounded-2xl bg-card shadow-e2"
        >
          {/* 細網格紋理，往右下淡出 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
          />
          <div className="relative grid gap-6 p-6 sm:px-8 sm:py-7 md:grid-cols-[1fr_minmax(0,22rem)] md:items-center md:gap-12">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium">
                <span aria-hidden="true" className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-fg opacity-40 motion-reduce:hidden" />
                  <span className="relative size-1.5 rounded-full bg-fg" />
                </span>
                {t.foundingEyebrow}
              </p>
              <h2
                id="founding-title"
                className="mt-3 text-2xl font-semibold tracking-tight text-balance"
              >
                <Money text={t.foundingTitle(foundingWindow.seats)} />
              </h2>
              <p className="mt-2 text-sm text-subtle tabular-nums">
                ≈ {foundingPrice.secondary}
              </p>
              <p className="mt-3 max-w-lg text-sm text-pretty text-subtle">
                {state === "upcoming"
                  ? t.foundingUpcoming(
                      dateFormat.format(foundingWindow.opensAt),
                      closesLabel,
                    )
                  : t.foundingOpen(closesLabel)}
              </p>
            </div>
            <div>
              {state === "open" && canBuy ? (
                <a
                  href="/go/checkout/founding"
                  className="flex w-full justify-center rounded-lg px-5 py-3 text-sm font-medium btn-primary"
                >
                  {t.foundingCta}
                </a>
              ) : (
                <WaitlistForm source="pricing-founding" messages={m.waitlist} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* 訂閱 / 買斷切換，預設先顯示訂閱；原本放在下方的訂閱區塊併進來 */}
      <PricingPlans
        subscription={subscriptionCards}
        oneTime={oneTimeCards}
        subscriptionNote={sub.lead}
        labels={{
          group: t.billingToggle.label,
          subscription: t.billingToggle.subscription,
          oneTime: t.billingToggle.oneTime,
          recommended: t.recommended,
          plans: t.plansLabel,
        }}
      />

      <div className="mt-8 text-center">
        <p className="text-sm text-subtle">{t.footnote(proCount)}</p>
        <p className="mt-1 text-xs text-subtle">{billingNote}</p>
      </div>

      <PlanCompare
        title={cmp.title}
        feature={cmp.feature}
        yes={cmp.yes}
        no={cmp.no}
        columns={compareColumns}
        rows={compareRows}
      />

      <SavingsCalculator price={prices.pro} locale={locale} t={t.calculator} />

      {!foundingHasForm && (
        <section
          id="waitlist"
          aria-labelledby="waitlist-title"
          className="mx-auto mt-24 max-w-md scroll-mt-24 text-center"
        >
          <h2
            id="waitlist-title"
            className="text-2xl font-semibold tracking-tight"
          >
            {m.common.launchUpdates}
          </h2>
          <p className="mt-2 mb-6 text-sm text-subtle">{t.waitlistBody}</p>
          <WaitlistForm source="pricing" messages={m.waitlist} />
        </section>
      )}

      <section
        aria-labelledby="faq-title"
        className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-16"
      >
        <h2
          id="faq-title"
          className="text-2xl font-semibold tracking-tight md:sticky md:top-24 md:self-start"
        >
          {t.faqTitle}
        </h2>
        <div className="divide-y divide-line border-y border-line">
          {t.faqs.map((faq, i) => (
            <details
              key={faq.q}
              name="pricing-faq"
              open={i === 0}
              className="group"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-medium transition-colors hover:text-subtle [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="relative size-3 shrink-0 text-subtle before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-200 after:ease-site group-open:after:scale-y-0"
                />
              </summary>
              <p className="-mt-1 pb-5 pr-8 text-sm leading-relaxed text-pretty text-subtle">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

/** 句子裡的金額（NT$2,490、$79）上色，其餘文字不變 */
function Money({ text }: { text: string }) {
  const parts = text.split(/((?:NT\$|US\$|\$|¥|￥)\s?[\d,]+)/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="bg-[linear-gradient(var(--price-angle),var(--price-a),var(--price-b))] bg-clip-text text-transparent tabular-nums"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
