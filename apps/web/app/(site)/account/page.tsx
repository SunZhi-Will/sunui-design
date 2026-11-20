import type { Metadata } from "next";
import Link from "next/link";

import { verifyAccountToken } from "@/lib/account";
import { checkoutCopy } from "@/lib/checkout-copy";
import { getI18n } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { getLicense, GRACE_MS, licenseExpired, type License } from "@/lib/orders";
import { polarPortalUrl } from "@/lib/polar";
import { shoplineSdkConfig } from "@/lib/shopline";
import { isSubscription, prices, pricesTwd } from "@/lib/site";

import { LinkForm, RenewalActions } from "./client";
import { MemberCard } from "./member-card";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = checkoutCopy((await getI18n()).locale);
  return { title: t.account.metaTitle, robots: { index: false } };
}

// 管理訂閱：沒有帳號系統，靠寄到訂閱 email 的簽章連結（lib/account.ts）。
// 美金（Polar）：取消、恢復走 Polar API，換卡與收據走 Polar 客戶入口。新台幣（SHOPLINE）：取消、恢復、內嵌式換卡都在這頁。
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ t?: string; card?: string }> }) {
  const { t: token = "", card } = await searchParams;
  const { locale, m } = await getI18n();
  const copy = checkoutCopy(locale);
  const t = copy.account;
  const licenseId = token ? await verifyAccountToken(token) : null;
  const license = licenseId ? await getLicense(licenseId).catch(() => null) : null;

  if (!license || license.status !== "active") {
    return (
      <div className="mx-auto grid max-w-5xl items-center gap-12 py-14 sm:py-20 md:grid-cols-[1.05fr_1fr] md:gap-16">
        <div className="mx-auto w-full max-w-[400px] md:order-2 md:max-w-none">
          <MemberCard plan="SunUI Pro" keyText="sunui_••••••••" blank />
        </div>
        <div className="md:order-1">
          <p className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">{t.loginEyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
          {token && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t.invalidLink}
            </p>
          )}
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-subtle">{t.lead}</p>
          <div className="mt-8 max-w-md">
            <LinkForm
              labels={{
                email: t.emailLabel,
                placeholder: t.emailPlaceholder,
                send: t.send,
                sending: t.sending,
                sent: t.sent,
                sentTitle: t.sentTitle,
                sentNote: t.sentNote,
                resend: t.resend,
              }}
            />
          </div>
          <p className="mt-8 max-w-md border-t border-line pt-6 text-sm text-subtle">
            {t.noPro}{" "}
            <Link href="/pricing" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              {t.seePlans}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const formatDay = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Taipei" }).format(new Date(iso));
  const formatShort = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { year: "numeric", month: "2-digit", timeZone: "Asia/Taipei" }).format(new Date(iso));
  const price = termPrice(license);
  const expired = licenseExpired(license);
  const ends = license.expiresAt ? formatDay(license.expiresAt) : "";
  const graceEnds = license.expiresAt ? formatDay(new Date(new Date(license.expiresAt).getTime() + GRACE_MS).toISOString()) : "";

  const pastDue = Boolean(!expired && license.autoRenew && license.pastDueSince);
  let status: string;
  let badge: keyof typeof t.badge | "lifetime";
  if (!license.expiresAt) [status, badge] = [t.lifetimeNote, "lifetime"];
  else if (expired) [status, badge] = [t.ended(ends), "ended"];
  else if (pastDue) [status, badge] = [t.pastDue(graceEnds), "pastDue"];
  else if (license.autoRenew) [status, badge] = [t.renews(ends, price), "active"];
  else if (license.autoRenew === false) [status, badge] = [t.ends(ends), "canceled"];
  else [status, badge] = [t.prepaid(ends), "prepaid"];
  const badgeLabel = badge === "lifetime" ? t.lifetime : t.badge[badge];

  const sdk = shoplineSdkConfig();
  const portal = license.renewVia === "polar" ? polarPortalUrl() : null;
  const perks = license.plan === "team" ? m.pricing.team.features : m.pricing.pro.features;
  const showRenewal = Boolean(license.expiresAt && !expired && license.autoRenew !== undefined);

  return (
    <div className="mx-auto max-w-5xl py-14 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">{t.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.welcome}</h1>
        <p className={`mt-3 text-[15px] leading-relaxed ${pastDue ? "font-medium text-fg" : "text-subtle"}`}>{status}</p>
        {card && license.renewVia === "shopline" && <p className="mt-2 text-sm text-subtle">{t.cardSaved}</p>}
      </header>

      <div className="mt-10 grid items-start gap-8 md:grid-cols-[1.05fr_1fr] md:gap-10">
        <div className="mx-auto w-full max-w-[460px] md:max-w-none">
          <MemberCard
            plan={copy.planName[license.plan]}
            keyText={license.display}
            metaLabel={license.expiresAt ? t.validThrough : t.memberSince}
            metaValue={license.expiresAt ? formatShort(license.expiresAt) : formatShort(license.createdAt)}
          />
          <Link
            href="/docs/pro"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-fg"
          >
            {t.howToUse}
            <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>

        <section className="rounded-xl bg-card shadow-e1">
          <dl className="divide-y divide-line px-6 text-sm">
            <Row label={t.plan}>{copy.planName[license.plan]}</Row>
            <Row label={t.status}>
              <Badge tone={badge}>{badgeLabel}</Badge>
            </Row>
            {license.expiresAt && <Row label={t.validThrough}>{ends}</Row>}
            <Row label={t.memberSince}>{formatDay(license.createdAt)}</Row>
            <Row label={t.key}>
              <span className="font-mono tracking-[0.12em]">{license.display}</span>
            </Row>
          </dl>

          {showRenewal && (
            <div className="border-t border-line px-6 py-6">
              <h2 className="mb-4 text-xs font-medium tracking-[0.16em] text-subtle uppercase">{t.billingTitle}</h2>
              <RenewalActions
                token={token}
                autoRenew={Boolean(license.autoRenew)}
                pastDue={pastDue}
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
                  cancelConfirm: t.cancelConfirm,
                  cancelConfirmYes: t.cancelConfirmYes,
                  keep: t.keep,
                }}
              />
            </div>
          )}

          {(expired || license.autoRenew === undefined) && license.expiresAt && (
            <div className="border-t border-line px-6 py-6">
              <Link href="/pricing#subscribe" className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium btn-primary">
                {t.resubscribe}
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">{t.perksTitle}</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-[15px]">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-fg text-bg shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
                <svg viewBox="0 0 16 16" aria-hidden className="size-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function termPrice(license: License) {
  if (!isSubscription(license.plan)) return "";
  return license.renewVia === "shopline" ? `NT$${pricesTwd[license.plan].toLocaleString("en-US")}` : `US$${prices[license.plan]}`;
}

// 黑白灰：正常（續訂中、終身）是實心，需要處理的（扣款失敗）用粗描邊，結束類用淡色
function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const style =
    tone === "active" || tone === "lifetime"
      ? "bg-fg text-bg shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]"
      : tone === "pastDue"
        ? "text-fg shadow-[inset_0_0_0_1.5px_var(--color-fg)]"
        : "text-subtle shadow-[inset_0_0_0_1px_var(--line-strong)]";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{children}</span>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <dt className="shrink-0 text-subtle">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
