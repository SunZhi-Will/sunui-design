"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { checkoutCopy } from "@/lib/checkout-copy";
import { googleClientId, verifyGoogleCredential } from "@/lib/google-auth";
import { getLocale } from "@/lib/i18n-server";
import { clientIp } from "@/lib/license";
import { notifyOwner, sendLicenseEmail } from "@/lib/mailer";
import { attachSession, createOrder, foundingSold, fulfillOrder, ORDER_COOKIE } from "@/lib/orders";
import { paymentOptions, providerFor } from "@/lib/payments";
import { createPolarCheckout, devPolar } from "@/lib/polar";
import { pipeline, sha256 } from "@/lib/redis";
import { createCheckoutSession, devCheckout } from "@/lib/shopline";
import { foundingState, foundingWindow, isPlan } from "@/lib/site";

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

  const session = await createCheckoutSession(order, ip, locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en");
  if (!session.ok) return { error: t.upstream };
  if (session.sessionId) await attachSession(order.id, session.sessionId).catch(() => {});
  redirect(session.url);
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
