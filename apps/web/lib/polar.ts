// Polar 導轉式結帳（美金，Polar 是 merchant of record，代收代繳各國消費稅）。
// 給台灣以外的客戶用；繁中介面預設仍走 SHOPLINE 新台幣。授權碼一樣由 SunUI 自己發（lib/orders.ts）。
//
// 環境變數：
// - POLAR_ACCESS_TOKEN   Polar 後台 Settings → Developers 產生的 Organization Access Token（checkouts:write）
// - POLAR_WEBHOOK_SECRET Webhooks 新增 <site>/api/polar/webhook 後拿到的 whsec_…。要勾：order.paid、order.refunded、
//                        subscription.active、subscription.canceled、subscription.uncanceled、subscription.past_due、subscription.revoked
// - POLAR_PRODUCT_IDS    每個方案對應的 Polar 商品 id，JSON：{"pro":"…","team":"…","founding":"…","monthly":"…","yearly":"…"}
//                        founding / pro / team 建成「一次性付款」商品；monthly、yearly 建成訂閱商品（Recurring，月繳、年繳），
//                        由 Polar 存卡、到期扣款、失敗重試。每一期扣款成功都會送 order.paid（billing_reason = subscription_cycle）
// - POLAR_ORG_SLUG       Polar 組織的 slug，用來組客戶自助入口網址（取消、換卡、收據），客戶用 email 驗證碼登入
// - POLAR_ENV            sandbox 走 sandbox-api.polar.sh；live 走正式環境；本機設 dev 會跳過 Polar 直接入帳
// 沒設定齊全時 polarConfigured() 為 false，結帳頁不會出現美金選項。

import type { Order } from "./orders";
import { isPlan, siteUrl, type Plan } from "./site";

const SANDBOX_BASE = "https://sandbox-api.polar.sh";
const LIVE_BASE = "https://api.polar.sh";

export function devPolar() {
  return process.env.POLAR_ENV === "dev" && process.env.NODE_ENV !== "production";
}

function productIds(): Partial<Record<Plan, string>> {
  try {
    const raw = JSON.parse(process.env.POLAR_PRODUCT_IDS ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter(([plan, id]) => isPlan(plan) && typeof id === "string" && id)) as Partial<Record<Plan, string>>;
  } catch {
    return {};
  }
}

/** Polar 商品 id 對回方案（訂閱在 Polar 入口改方案後，續扣的 order 會是另一個商品）。 */
export function planForPolarProduct(productId: string): Plan | null {
  if (!productId) return null;
  const found = Object.entries(productIds()).find(([, id]) => id === productId);
  return found ? (found[0] as Plan) : null;
}

/** 金鑰與五個方案的商品 id 都設定好了。 */
export function polarConfigured() {
  if (devPolar()) return true;
  const ids = productIds();
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN &&
      process.env.POLAR_WEBHOOK_SECRET &&
      (["founding", "pro", "team", "monthly", "yearly"] as Plan[]).every((plan) => ids[plan]),
  );
}

/** Polar 客戶自助入口：取消訂閱、換卡、看收據。沒設定 POLAR_ORG_SLUG 時回 null。 */
export function polarPortalUrl() {
  const slug = process.env.POLAR_ORG_SLUG?.trim();
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return null;
  return `${process.env.POLAR_ENV === "live" ? "https://polar.sh" : "https://sandbox.polar.sh"}/${slug}/portal`;
}

export type PolarSessionResult = { ok: true; url: string; checkoutId?: string } | { ok: false };

export async function createPolarCheckout(order: Order): Promise<PolarSessionResult> {
  const product = productIds()[order.plan];
  if (!product) return { ok: false };
  const base = process.env.POLAR_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
  try {
    const response = await fetch(`${base}/v1/checkouts/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN ?? ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        products: [product],
        customer_email: order.email,
        // 付款後回到我們的完成頁；入帳以 order.paid 通知為準
        success_url: `${siteUrl()}/api/checkout/return?o=${order.id}`,
        return_url: `${siteUrl()}/pricing`,
        metadata: { sunui_order: order.id },
        // 金額要和訂單對得上，不開放折扣碼
        allow_discount_codes: false,
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as { url?: unknown; id?: unknown } | null;
    if (!response.ok || !data || typeof data.url !== "string" || !data.url.startsWith("https://")) {
      console.error(`[polar] checkout create ${response.status}`);
      return { ok: false };
    }
    return { ok: true, url: data.url, checkoutId: typeof data.id === "string" ? data.id.slice(0, 64) : undefined };
  } catch {
    return { ok: false };
  }
}

/**
 * 取消或恢復 Polar 訂閱的自動續扣（cancel_at_period_end），/account 的按鈕用。
 * 需要 Organization Access Token 有 subscriptions:write。結果一樣會由 subscription.canceled / uncanceled 通知寫回授權。
 */
export async function setPolarCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
  if (devPolar() || subscriptionId.startsWith("dev_")) return true;
  if (!/^[0-9a-f-]{36}$/i.test(subscriptionId)) return false;
  const base = process.env.POLAR_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
  try {
    const response = await fetch(`${base}/v1/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN ?? ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cancel_at_period_end: cancel }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) console.error(`[polar] subscription update ${response.status}`);
    return response.ok;
  } catch {
    return false;
  }
}
