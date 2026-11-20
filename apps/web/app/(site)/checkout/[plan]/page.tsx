import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { checkoutCopy } from "@/lib/checkout-copy";
import { googleClientId } from "@/lib/google-auth";
import { getLocale } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { foundingSold } from "@/lib/orders";
import { defaultCurrency, paymentOptions } from "@/lib/payments";
import { shoplineRecurringReady } from "@/lib/shopline";
import { addTerm, foundingState, foundingWindow, isPlan, isSubscription, planPrice, planUsd, pricesTwd } from "@/lib/site";
import { cn } from "@/lib/utils";

import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = checkoutCopy(await getLocale());
  return { title: t.metaTitle, robots: { index: false } };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const { plan } = await params;
  if (!isPlan(plan)) notFound();
  const locale = await getLocale();
  // 幣別：繁中預設新台幣（SHOPLINE），其他語系預設美金（Polar）；網址的 ?pay= 可以切換
  // 月訂、年訂要綁卡自動續扣：新台幣得等內嵌式 SDK 設定好（SHOPLINE_CLIENT_KEY），不然只剩美金
  const twdBlocked = isSubscription(plan) && !shoplineRecurringReady();
  const requested = (await searchParams).pay;
  const currency = twdBlocked ? (paymentOptions().usd ? "usd" : null) : defaultCurrency(locale, requested);
  if (!currency) redirect("/pricing#waitlist");
  if (plan === "founding") {
    if (foundingState() !== "open") redirect("/pricing");
    if ((await foundingSold().catch(() => 0)) >= foundingWindow.seats) redirect("/pricing");
  }

  const t = checkoutCopy(locale);
  const options = { ...paymentOptions(), ...(twdBlocked ? { twd: false } : {}) };
  const usd = planUsd(plan);
  const twd = pricesTwd[plan].toLocaleString("en-US");
  const formatDay = (date: Date) =>
    new Intl.DateTimeFormat(intlLocale(locale), { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Taipei" }).format(date);
  // 創始會員開賣前買 Pro 買斷：保證開賣後可以退差價
  const showGuard = plan === "pro" && foundingState() === "upcoming";
  const shortDate = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric", timeZone: "Asia/Taipei" });

  return (
    <div className="mx-auto max-w-md py-16 sm:py-20">
      <Link href="/pricing" className="text-sm text-subtle hover:text-fg">
        ← {t.back}
      </Link>
      <div className="mt-6 rounded-lg border border-line bg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-subtle">SunUI Pro</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.planName[plan]}</h1>
        <p className="mt-1 text-sm text-subtle">{t.planNote[plan]}</p>

        {options.twd && options.usd && (
          <div className="mt-6">
            <p className="text-xs font-medium text-subtle">{t.payWith.label}</p>
            <div role="radiogroup" aria-label={t.payWith.label} className="mt-2 grid grid-cols-2 gap-2">
              {(["twd", "usd"] as const).map((c) => (
                <Link
                  key={c}
                  href={`/checkout/${plan}?pay=${c}`}
                  replace
                  scroll={false}
                  role="radio"
                  aria-checked={currency === c}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    currency === c ? "border-fg bg-bg" : "border-line text-subtle hover:border-fg/50 hover:text-fg",
                  )}
                >
                  <span className="block font-medium">{t.payWith[c]}</span>
                  <span className="block text-xs text-subtle">{c === "twd" ? t.payWith.twdHint : t.payWith.usdHint}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {currency === "usd" ? (
          <>
            <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">US${usd}</p>
            <p className="mt-2 text-sm text-subtle">{t.chargedInUsd}</p>
          </>
        ) : (
          <>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">NT${twd}</span>
              <span className="text-sm text-subtle tabular-nums">≈ US${usd}</span>
            </p>
            {/* 繁中的主價格本來就是台幣，不必再講一次 */}
            {locale !== "zh-TW" && <p className="mt-2 text-sm text-subtle">{t.chargedInTwd(twd, usd)}</p>}
          </>
        )}

        {isSubscription(plan) && (
          <>
            {/* 自動續扣的揭露：付款前就看得到之後每期扣多少、從哪天開始、怎麼取消 */}
            <p className="mt-4 rounded-md border border-line bg-bg p-3 text-xs text-subtle">
              {t.autoRenewNote(currency === "usd" ? `US$${usd}` : `NT$${twd}`, plan === "yearly" ? "year" : "month", formatDay(addTerm(plan, new Date())))}
            </p>
            <p className="mt-2 text-xs text-subtle">{t.renewHint}</p>
          </>
        )}
        {showGuard && (
          <p className="mt-4 rounded-md border border-line bg-bg p-3 text-xs text-subtle">
            {t.priceGuard(
              shortDate.format(foundingWindow.opensAt),
              currency === "usd" ? planPrice("founding", locale).usd : planPrice("founding", locale).twd,
            )}
          </p>
        )}

        <div className="mt-6 border-t border-line pt-6">
          <CheckoutForm
            plan={plan}
            currency={currency}
            googleClientId={googleClientId()}
            locale={locale}
            t={{ emailLabel: t.emailLabel, emailHint: t.emailHint, pay: t.pay, paying: t.paying, google: t.google }}
          />
        </div>
        <p className="mt-4 text-xs text-subtle">
          {t.terms}{" "}
          <Link href="/license" className="underline underline-offset-2 hover:text-fg">
            {t.termsLink}
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-subtle">{currency === "usd" ? t.secureUsd : t.secure}</p>
    </div>
  );
}
