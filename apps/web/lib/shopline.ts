// SHOPLINE Payments 導轉式結帳（買斷，不綁卡）。請求格式照作者 VideoAligner 的 plusCheckout，
// 那份格式已經在 PostVault 用真實付款驗證過。
//
// 環境變數：SHOPLINE_MERCHANT_ID、SHOPLINE_API_KEY、SHOPLINE_SIGN_KEY（SunUI 這一列 webhook 專屬）、
// SHOPLINE_ENV（live 走正式環境；其他值走 sandbox；本機設 dev 會跳過 SHOPLINE 直接入帳）。

import type { Order } from "./orders";
import { randomHex, sha256 } from "./redis";
import { PRODUCT_PREFIX } from "./shopline-core";
import { siteUrl } from "./site";

const SANDBOX_BASE = "https://api-sandbox.shoplinepayments.com";
const LIVE_BASE = "https://api.shoplinepayments.com";

const PRODUCT_NAME: Record<Order["plan"], string> = {
  founding: `${PRODUCT_PREFIX} Pro Founding member (lifetime)`,
  pro: `${PRODUCT_PREFIX} Pro (lifetime)`,
  team: `${PRODUCT_PREFIX} Pro Team, 5 seats (lifetime)`,
};

export function devCheckout() {
  return process.env.SHOPLINE_ENV === "dev" && process.env.NODE_ENV !== "production";
}

export type SessionResult = { ok: true; url: string; sessionId?: string } | { ok: false };

export async function createCheckoutSession(order: Order, clientIp: string, language: "zh-TW" | "en"): Promise<SessionResult> {
  const base = process.env.SHOPLINE_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
  const person = { lastName: "Customer", email: order.email };
  const address = { countryCode: "TW", street: "N/A" };
  // SHOPLINE 的金額單位是新台幣 × 100
  const amount = { value: order.amountTwd * 100, currency: "TWD" };
  try {
    const response = await fetch(`${base}/api/v1/trade/sessions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchantId: process.env.SHOPLINE_MERCHANT_ID ?? "",
        apiKey: process.env.SHOPLINE_API_KEY ?? "",
        requestId: randomHex(16),
        idempotentKey: order.id,
      },
      body: JSON.stringify({
        referenceId: order.id,
        amount,
        language,
        expireTime: 60,
        returnUrl: `${siteUrl()}/api/checkout/return?o=${order.id}`,
        mode: "regular",
        allowPaymentMethodList: ["CreditCard"],
        order: {
          products: [{ id: order.plan, name: PRODUCT_NAME[order.plan], quantity: 1, amount }],
          shipping: { shippingMethod: "Digital", carrier: "None", personalInfo: person, address },
        },
        billing: { personalInfo: person, address },
        customer: { referenceCustomerId: (await sha256(order.email)).slice(0, 32), personalInfo: person },
        client: { ip: clientIp.slice(0, 32) },
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as { sessionUrl?: unknown; sessionId?: unknown } | null;
    if (!response.ok || !data || typeof data.sessionUrl !== "string" || !data.sessionUrl.startsWith("https://")) {
      console.error(`[shopline] session create ${response.status}`);
      return { ok: false };
    }
    return { ok: true, url: data.sessionUrl, sessionId: typeof data.sessionId === "string" ? data.sessionId.slice(0, 128) : undefined };
  } catch {
    return { ok: false };
  }
}
