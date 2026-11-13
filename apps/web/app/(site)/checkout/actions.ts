"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { checkoutCopy } from "@/lib/checkout-copy";
import { getLocale } from "@/lib/i18n-server";
import { clientIp } from "@/lib/license";
import { notifyOwner, sendLicenseEmail } from "@/lib/mailer";
import { attachSession, createOrder, foundingSold, fulfillOrder, ORDER_COOKIE } from "@/lib/orders";
import { pipeline, sha256 } from "@/lib/redis";
import { createCheckoutSession, devCheckout } from "@/lib/shopline";
import { checkoutReady, foundingState, foundingWindow, isPlan } from "@/lib/site";

export type CheckoutState = { error?: string };

/** 同一個 IP 10 分鐘最多建 10 筆訂單，避免有人灌爆訂單列表。 */
async function rateLimited(ip: string) {
  try {
    const key = `rl:checkout:${(await sha256(`checkout:${ip}`)).slice(0, 24)}:${Math.floor(Date.now() / 600_000)}`;
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

  if (!isPlan(plan) || !checkoutReady()) return { error: t.closed };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: t.email };
  if (plan === "founding") {
    if (foundingState() !== "open") return { error: t.closed };
    if ((await foundingSold()) >= foundingWindow.seats) return { error: t.soldOut };
  }
  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (await rateLimited(ip)) return { error: t.rate };

  let order;
  try {
    order = await createOrder(plan, email);
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

  // 本機開發模式：不經過 SHOPLINE，直接入帳，方便測完整流程
  if (devCheckout()) {
    const issued = await fulfillOrder(order, "", process.env.SUNUI_ADMIN_TOKEN ?? "dev-secret");
    if (issued) {
      await sendLicenseEmail(order, issued.key);
      await notifyOwner(order);
    }
    redirect(`/checkout/done?o=${order.id}`);
  }

  const session = await createCheckoutSession(order, ip, locale === "zh-TW" || locale === "zh-CN" ? "zh-TW" : "en");
  if (!session.ok) return { error: t.upstream };
  if (session.sessionId) await attachSession(order.id, session.sessionId).catch(() => {});
  redirect(session.url);
}
