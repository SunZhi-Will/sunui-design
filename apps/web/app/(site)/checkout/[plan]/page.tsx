import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { checkoutCopy } from "@/lib/checkout-copy";
import { getLocale } from "@/lib/i18n-server";
import { foundingSold } from "@/lib/orders";
import { checkoutReady, foundingState, foundingWindow, isPlan, prices, pricesTwd } from "@/lib/site";

import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = checkoutCopy(await getLocale());
  return { title: t.metaTitle, robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  if (!isPlan(plan)) notFound();
  if (!checkoutReady()) redirect("/pricing#waitlist");
  if (plan === "founding") {
    if (foundingState() !== "open") redirect("/pricing");
    if ((await foundingSold().catch(() => 0)) >= foundingWindow.seats) redirect("/pricing");
  }

  const locale = await getLocale();
  const t = checkoutCopy(locale);
  const usd = plan === "founding" ? prices.founding : prices[plan];
  const twd = pricesTwd[plan].toLocaleString("en-US");

  return (
    <div className="mx-auto max-w-md py-16 sm:py-20">
      <Link href="/pricing" className="text-sm text-subtle hover:text-fg">
        ← {t.back}
      </Link>
      <div className="mt-6 rounded-lg border border-line bg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-subtle">SunUI Pro</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.planName[plan]}</h1>
        <p className="mt-1 text-sm text-subtle">{t.planNote[plan]}</p>
        <p className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">${usd}</span>
          <span className="text-sm text-subtle">USD</span>
        </p>
        <p className="mt-2 text-sm text-subtle">{t.chargedInTwd(twd, usd)}</p>
        <div className="mt-6 border-t border-line pt-6">
          <CheckoutForm plan={plan} t={{ emailLabel: t.emailLabel, emailHint: t.emailHint, pay: t.pay, paying: t.paying }} />
        </div>
        <p className="mt-4 text-xs text-subtle">
          {t.terms}{" "}
          <Link href="/license" className="underline underline-offset-2 hover:text-fg">
            /license
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-subtle">{t.secure}</p>
    </div>
  );
}
