"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { checkoutCopy } from "@/lib/checkout-copy";
import { googleClientId, verifyGoogleCredential } from "@/lib/google-auth";
import { getLocale } from "@/lib/i18n-server";
import { clientIp } from "@/lib/license";
import { notifyOwner, sendLicenseEmail } from "@/lib/mailer";
import {
  attachSession,
  createOrder,
  foundingSold,
  fulfillOrder,
  getOrder,
  hasActiveAutoRenew,
  linkPolarSubscription,
  linkShoplineCustomer,
  ORDER_COOKIE,
  rememberShoplineCard,
} from "@/lib/orders";
import { paymentOptions, providerFor } from "@/lib/payments";
import { createPolarCheckout, devPolar } from "@/lib/polar";
import { pipeline, sha256 } from "@/lib/redis";
import {
  createCardBindPayment,
  createCheckoutSession,
  devCheckout,
  shoplineCustomerRef,
  shoplineRecurringReady,
} from "@/lib/shopline";
import { foundingState, foundingWindow, isPlan, isSubscription } from "@/lib/site";

export type CheckoutState = { error?: string };

/** 同一個 IP 10 分鐘最多 10 次：建訂單（checkout）與 Google 驗證（google）各算各的。 */
async function rateLimited(ip: string, kind: "checkout" | "google" = "checkout") {
  try {
    const key = `rl:${kind}:${(await sha256(`${kind}:${ip}`)).slice(0, 24)}:${Math.floor(Date.now() / 600_000)}`;
    const replies = await pipeline([["INCR", key], ["EXPIRE", key, 600]]);
    return replies ? Number(replies[0]?.result) > 10 : false;
  } catch {
    return false;
  }
}

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const locale = await getLocale();
  const t = checkoutCopy(locale).errors;
  const plan = String(formData.get("plan") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const currency = formData.get("currency") === "usd" ? "usd" : "twd";

  // 選的幣別要真的可以用（SHOPLINE 收新台幣、Polar 收美金）
  if (!isPlan(plan) || !paymentOptions()[currency]) return { error: t.closed };
  const provider = providerFor(currency);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: t.email };
  if (plan === "founding") {
    if (foundingState() !== "open") return { error: t.closed };
    if ((await foundingSold()) >= foundingWindow.seats) return { error: t.soldOut };
  }
  // 月訂、年訂會自動續扣：新台幣要能綁卡（內嵌式 SDK），而且同一個 email 不能同時有兩份自動扣款
  if (isSubscription(plan)) {
    if (provider === "shopline" && !shoplineRecurringReady()) return { error: t.closed };
    if (await hasActiveAutoRenew(email).catch(() => false)) return { error: t.alreadySubscribed };
  }
  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (await rateLimited(ip)) return { error: t.rate };

  let order;
  try {
    order = await createOrder(plan, email, { provider });
  } catch {
    return { error: t.upstream };
  }
  (await cookies()).set(ORDER_COOKIE, `${order.id}.${order.viewToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  // 本機開發模式：不經過 SHOPLINE / Polar，直接入帳，方便測完整流程
  if (provider === "shopline" ? devCheckout() : devPolar()) {
    const issued = await fulfillOrder(order, "", process.env.SUNUI_ADMIN_TOKEN ?? "dev-secret");
    // 訂閱：假裝綁好卡 / 建好 Polar 訂閱，續扣流程（cron、/account）在本機也能走一遍
    if (issued && isSubscription(plan)) {
      if (provider === "shopline") {
        await linkShoplineCustomer(issued.licenseId, await shoplineCustomerRef(email), { customerId: "dev", instrumentId: `dev_${order.id}` });
      } else {
        await linkPolarSubscription(issued.licenseId, `dev_${order.id}`, "dev");
      }
    }
    if (issued) {
      await sendLicenseEmail(order, issued);
      await notifyOwner(order, issued);
    }
    redirect(`/checkout/done?o=${order.id}`);
  }

  if (provider === "polar") {
    const polar = await createPolarCheckout(order);
    if (!polar.ok) return { error: t.upstream };
    if (polar.checkoutId) await attachSession(order.id, polar.checkoutId).catch(() => {});
    redirect(polar.url);
  }

  // 新台幣訂閱：導轉式不能綁卡，改到內嵌式刷卡頁
  if (isSubscription(plan)) redirect(`/checkout/card?o=${order.id}`);

  const session = await createCheckoutSession(order, ip, locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en");
  if (!session.ok) return { error: t.upstream };
  if (session.sessionId) await attachSession(order.id, session.sessionId).catch(() => {});
  redirect(session.url);
}

export type CardPayResult = { nextAction?: unknown; done?: boolean; error?: string };

/**
 * 內嵌式刷卡頁按下付款：前端 SDK 給的 paySession 轉給 SHOPLINE（綁卡並付款），回 nextAction 讓 SDK 完成付款與 3D 驗證。
 * 只有發起結帳的瀏覽器（cookie 對得上）可以付這筆訂單。
 */
export async function payWithCard(orderId: string, paySession: string): Promise<CardPayResult> {
  const locale = await getLocale();
  const t = checkoutCopy(locale).errors;
  const [cookieId, viewToken] = ((await cookies()).get(ORDER_COOKIE)?.value ?? "").split(".");
  const order = await getOrder(orderId).catch(() => null);
  if (!order || cookieId !== order.id || !viewToken || viewToken !== order.viewToken) return { error: t.closed };
  if (order.status !== "pending" || order.provider !== "shopline" || !isSubscription(order.plan)) return { done: order.status === "paid" };
  if (typeof paySession !== "string" || paySession.length === 0 || paySession.length > 16_000) return { error: t.card };

  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (await rateLimited(ip)) return { error: t.rate };
  const result = await createCardBindPayment(order, paySession, ip, locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en");
  if (!result.ok) return { error: t.card };
  await attachSession(order.id, result.tradeOrderId).catch(() => {});
  // 回應就帶了綁好的卡：先暫存，入帳時接到授權上（通知先到也一樣）
  if (result.customerId && result.instrumentId) {
    await rememberShoplineCard(await shoplineCustomerRef(order.email), result.customerId, result.instrumentId).catch(() => null);
  }
  return { nextAction: result.nextAction ?? undefined, done: !result.nextAction && result.status === "SUCCEEDED" };
}

export type GoogleEmailResult = { email?: string; error?: string };

/**
 * 結帳頁「用 Google 繼續」：驗證 Google 的 ID token，回傳 Google 已驗證過的 email 填進表單。
 * 不建立帳號、不留 session，email 送出時一樣走 startCheckout 的檢查；只是讓買家不用打字，也不會打錯收授權碼的信箱。
 */
export async function googleCheckoutEmail(credential: string): Promise<GoogleEmailResult> {
  const t = checkoutCopy(await getLocale()).google;
  const clientId = googleClientId();
  if (!clientId) return { error: t.failed };
  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (await rateLimited(ip, "google")) return { error: checkoutCopy(await getLocale()).errors.rate };
  const profile = await verifyGoogleCredential(credential, clientId);
  if (!profile || profile.email.length > 254) return { error: t.failed };
  return { email: profile.email };
}
