"use server";

import { headers } from "next/headers";

import { signAccountToken, verifyAccountToken } from "@/lib/account";
import { checkoutCopy } from "@/lib/checkout-copy";
import { getLocale } from "@/lib/i18n-server";
import { clientIp } from "@/lib/license";
import { sendAccountLink } from "@/lib/mailer";
import { getLicense, licenseExpired, rememberShoplineCard, setAutoRenew, subscriptionLicenseFor } from "@/lib/orders";
import { setPolarCancelAtPeriodEnd } from "@/lib/polar";
import { pipeline, sha256 } from "@/lib/redis";
import { createCardBind, shoplineCustomerRef, unbindCard } from "@/lib/shopline";
import { siteUrl } from "@/lib/site";

export type LinkState = { sent?: boolean; error?: string; devLink?: string };
export type ActionResult = { ok?: boolean; error?: string };

/** 同一個 IP 10 分鐘最多 5 次（寄信、換卡各算各的）。 */
async function rateLimited(kind: string, limit = 5) {
  try {
    const ip = clientIp(new Request("http://x", { headers: await headers() }));
    const key = `rl:account:${kind}:${(await sha256(`${kind}:${ip}`)).slice(0, 24)}:${Math.floor(Date.now() / 600_000)}`;
    const replies = await pipeline([["INCR", key], ["EXPIRE", key, 600]]);
    return replies ? Number(replies[0]?.result) > limit : false;
  } catch {
    return false;
  }
}

/** 寄管理連結。不管有沒有這個訂閱都回同一句話，不洩漏誰有訂閱。 */
export async function requestAccountLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const t = checkoutCopy(await getLocale());
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: t.errors.email };
  if (await rateLimited("link")) return { error: t.errors.rate };
  try {
    const license = await subscriptionLicenseFor(email);
    if (license) {
      const token = await signAccountToken(license.id);
      if (token) {
        const link = `${siteUrl()}/account?t=${token}`;
        await sendAccountLink(email, link);
        // 本機沒有寄信服務：直接把連結給開發者
        if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) return { sent: true, devLink: link };
      }
    }
  } catch {
    return { error: t.account.failed };
  }
  return { sent: true };
}

async function licenseFromToken(token: string) {
  const id = await verifyAccountToken(token);
  if (!id) return null;
  const license = await getLicense(id);
  return license && license.status === "active" && license.expiresAt ? license : null;
}

/** 取消自動續扣：用到這期結束。Polar 的要先在 Polar 取消，成功才改授權。 */
export async function cancelRenewal(token: string): Promise<ActionResult> {
  const t = checkoutCopy(await getLocale()).account;
  const license = await licenseFromToken(token);
  if (!license) return { error: t.invalidLink };
  if (license.renewVia === "polar" && license.polarSubscription) {
    if (!(await setPolarCancelAtPeriodEnd(license.polarSubscription, true))) return { error: t.failed };
  }
  await setAutoRenew(license.id, false);
  return { ok: true };
}

/** 恢復自動續扣（還沒過期才行；新台幣要還有綁著的卡）。 */
export async function resumeRenewal(token: string): Promise<ActionResult> {
  const t = checkoutCopy(await getLocale()).account;
  const license = await licenseFromToken(token);
  if (!license || licenseExpired(license)) return { error: t.invalidLink };
  if (license.renewVia === "polar" && license.polarSubscription) {
    if (!(await setPolarCancelAtPeriodEnd(license.polarSubscription, false))) return { error: t.failed };
  } else if (license.renewVia !== "shopline" || !license.slpInstrument) {
    return { error: t.failed };
  }
  await setAutoRenew(license.id, true);
  return { ok: true };
}

export type CardResult = { nextAction?: unknown; done?: boolean; error?: string };

/** 新台幣換卡：SDK 給的 paySession 轉給 SHOPLINE 綁卡（NT$1 授權隨即取消）。新卡由綁卡通知寫回授權。 */
export async function updateCard(token: string, paySession: string): Promise<CardResult> {
  const locale = await getLocale();
  const t = checkoutCopy(locale);
  const license = await licenseFromToken(token);
  if (!license || license.renewVia !== "shopline") return { error: t.account.invalidLink };
  if (typeof paySession !== "string" || paySession.length === 0 || paySession.length > 16_000) return { error: t.errors.card };
  if (await rateLimited("card", 10)) return { error: t.errors.rate };

  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  const result = await createCardBind(
    license.email,
    paySession,
    ip,
    locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en",
    `${siteUrl()}/account?t=${token}&card=1`,
  );
  if (!result.ok) return { error: t.errors.card };
  if (result.customerId && result.instrumentId) {
    const linked = await rememberShoplineCard(await shoplineCustomerRef(license.email), result.customerId, result.instrumentId).catch(() => null);
    if (linked?.previous) await unbindCard(linked.previous.customerId, linked.previous.instrumentId);
  }
  return { nextAction: result.nextAction ?? undefined, done: !result.nextAction };
}
