import type { Metadata } from "next";
import Link from "next/link";

import { verifyAccountToken } from "@/lib/account";
import { checkoutCopy } from "@/lib/checkout-copy";
import { getLocale } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getLicense, GRACE_MS, licenseExpired, type License } from "@/lib/orders";
import { polarPortalUrl } from "@/lib/polar";
import { shoplineSdkConfig } from "@/lib/shopline";
import { isSubscription, prices, pricesTwd } from "@/lib/site";

import { LinkForm, RenewalActions } from "./client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = checkoutCopy(await getLocale());
  return { title: t.account.metaTitle, robots: { index: false } };
}

// 管理訂閱：沒有帳號系統，靠寄到訂閱 email 的簽章連結（lib/account.ts）。
// 美金（Polar）：取消、恢復走 Polar API，換卡與收據走 Polar 客戶入口。新台幣（SHOPLINE）：取消、恢復、內嵌式換卡都在這頁。
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ t?: string; card?: string }> }) {
  const { t: token = "", card } = await searchParams;
  const locale = await getLocale();
  const copy = checkoutCopy(locale);
  const t = copy.account;
  const licenseId = token ? await verifyAccountToken(token) : null;
  const license = licenseId ? await getLicense(licenseId).catch(() => null) : null;

  if (!license || license.status !== "active") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        {token && <p className="mt-2 text-sm text-destructive">{t.invalidLink}</p>}
        <p className="mt-2 text-sm text-subtle">{t.lead}</p>
        <div className="mt-6">
          <LinkForm labels={{ email: t.emailLabel, send: t.send, sending: t.sending, sent: t.sent }} />
        </div>
      </Shell>
    );
  }

  const formatDay = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Taipei" }).format(new Date(iso));
  const price = termPrice(license);
  const expired = licenseExpired(license);
  const ends = license.expiresAt ? formatDay(license.expiresAt) : "";
  const graceEnds = license.expiresAt ? formatDay(new Date(new Date(license.expiresAt).getTime() + GRACE_MS).toISOString()) : "";

  let status: string;
  if (!license.expiresAt) status = t.noSubscription;
  else if (expired) status = t.ended(ends);
  else if (license.autoRenew && license.pastDueSince) status = t.pastDue(graceEnds);
  else if (license.autoRenew) status = t.renews(ends, price);
  else if (license.autoRenew === false) status = t.ends(ends);
  else status = t.prepaid(ends);

  const sdk = shoplineSdkConfig();
  const portal = license.renewVia === "polar" ? polarPortalUrl() : null;

  return (
    <Shell>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <Row label={t.plan}>{copy.planName[license.plan]}</Row>
        <Row label={t.key}>
          <span className="font-mono">{license.display}</span>
        </Row>
        <Row label={t.status}>{status}</Row>
      </dl>
      {card && license.renewVia === "shopline" && <p className="mt-4 text-sm text-subtle">{t.cardSaved}</p>}

      {license.expiresAt && !expired && license.autoRenew !== undefined && (
        <div className="mt-8 border-t border-line pt-6">
          <RenewalActions
            token={token}
            autoRenew={Boolean(license.autoRenew)}
            canResume={license.renewVia === "polar" ? Boolean(license.polarSubscription) : Boolean(license.slpInstrument)}
            card={
              license.renewVia === "shopline" && sdk
                ? {
                    config: { clientKey: sdk.clientKey, merchantId: sdk.merchantId, sandbox: sdk.env === "sandbox" },
                    language: locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en",
                  }
                : null
            }
            portal={portal}
            labels={{
              cancel: t.cancel,
              cancelNote: t.cancelNote(ends),
              canceled: t.canceled,
              resume: t.resume,
              resumed: t.resumed,
              updateCard: t.updateCard,
              updateCardLead: t.updateCardLead,
              saveCard: t.saveCard,
              cardSaved: t.cardSaved,
              portal: t.portal,
              portalLead: t.portalLead,
              failed: t.failed,
              loading: copy.card.loading,
              loadError: copy.card.loadError,
              pending: copy.card.paying,
              cardFailed: copy.errors.card,
            }}
          />
        </div>
      )}

      {(expired || license.autoRenew === undefined) && (
        <Link href="/pricing#subscribe" className="mt-8 inline-flex rounded-md px-4 py-2 text-sm font-medium btn-primary">
          {t.resubscribe}
        </Link>
      )}
    </Shell>
  );
}

function termPrice(license: License) {
  if (!isSubscription(license.plan)) return "";
  return license.renewVia === "shopline" ? `NT$${pricesTwd[license.plan].toLocaleString("en-US")}` : `US$${prices[license.plan]}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3">
      <dt className="text-subtle">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-16 sm:py-20">
      <div className="rounded-lg border border-line bg-card p-6 sm:p-8">{children}</div>
    </div>
  );
}
