import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { checkoutCopy } from "@/lib/checkout-copy";
import { getLocale } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getOrder, ORDER_COOKIE } from "@/lib/orders";
import { shoplineSdkConfig } from "@/lib/shopline";
import { addTerm, isSubscription } from "@/lib/site";

import { CardCheckout } from "./client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = checkoutCopy(await getLocale());
  return { title: t.card.metaTitle, robots: { index: false } };
}

// 新台幣訂閱的刷卡頁：SHOPLINE 內嵌式 SDK 綁卡並付第一期。只有發起結帳的瀏覽器（cookie）看得到。
export default async function CardCheckoutPage({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const id = (await searchParams).o ?? "";
  const order = await getOrder(id).catch(() => null);
  const [cookieId, viewToken] = ((await cookies()).get(ORDER_COOKIE)?.value ?? "").split(".");
  if (!order || cookieId !== order.id || !viewToken || viewToken !== order.viewToken) redirect("/pricing");
  if (order.status !== "pending") redirect(`/checkout/done?o=${order.id}`);
  if (order.provider !== "shopline" || !isSubscription(order.plan)) redirect("/pricing");
  const sdk = shoplineSdkConfig();
  if (!sdk) redirect("/pricing");

  const locale = await getLocale();
  const t = checkoutCopy(locale);
  const twd = `NT$${order.amountTwd.toLocaleString("en-US")}`;
  const formatDay = (date: Date) =>
    new Intl.DateTimeFormat(intlLocale(locale), { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Taipei" }).format(date);

  return (
    <div className="mx-auto max-w-md py-16 sm:py-20">
      <Link href={`/checkout/${order.plan}`} className="text-sm text-subtle hover:text-fg">
        ← {t.back}
      </Link>
      <div className="mt-6 rounded-lg border border-line bg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-subtle">SunUI Pro</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.planName[order.plan]}</h1>
        <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">{twd}</p>
        <p className="mt-4 rounded-md border border-line bg-bg p-3 text-xs text-subtle">
          {t.autoRenewNote(twd, order.plan === "yearly" ? "year" : "month", formatDay(addTerm(order.plan, new Date())))}
        </p>
        <p className="mt-2 text-xs text-subtle">{order.email}</p>
        <div className="mt-6 border-t border-line pt-6">
          <CardCheckout
            orderId={order.id}
            config={{ clientKey: sdk.clientKey, merchantId: sdk.merchantId, sandbox: sdk.env === "sandbox" }}
            amountMinor={order.amountTwd * 100}
            language={locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en"}
            labels={{ loading: t.card.loading, loadError: t.card.loadError, submit: t.card.pay(twd), pending: t.card.paying, failed: t.errors.card }}
          />
        </div>
        <p className="mt-4 text-xs text-subtle">
          {t.terms}{" "}
          <Link href="/license" className="underline underline-offset-2 hover:text-fg">
            {t.termsLink}
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-subtle">{t.card.secure}</p>
    </div>
  );
}
