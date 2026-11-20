// Polar（美金收款，merchant of record）的純邏輯：通知驗簽、通知欄位解析。沒有 I/O，方便單元測試。
//
// 驗簽照 Polar 文件（docs/integrate/webhooks/delivery）：標頭 webhook-id、webhook-timestamp、webhook-signature，
// 簽章 = base64(HMAC-SHA256(key, `${id}.${timestamp}.${原始本文}`))，標頭裡可能有多組「v1,<簽章>」以空白分隔。
// 金鑰有兩種，兩種都試：
// - 2026-09-08 之後產生的（Standard Webhooks）：whsec_ 後面那段 base64 解開的位元組
// - 舊的（Polar HMAC）：整串 whsec_… 的 UTF-8 位元組

/** 通知時間與現在相差超過 5 分鐘就拒收，擋重放。 */
const TOLERANCE_SECONDS = 5 * 60;

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacBase64(key: Uint8Array, content: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(content));
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

function candidateKeys(secret: string) {
  const keys: Uint8Array[] = [new TextEncoder().encode(secret)];
  const body = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    keys.unshift(Uint8Array.from(atob(body), (c) => c.charCodeAt(0)));
  } catch {
    // 不是 base64：只剩舊格式可試
  }
  return keys;
}

export type PolarHeaders = { id: string; timestamp: string; signature: string };

export async function verifyPolarSignature(rawBody: string, headers: PolarHeaders, secret: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || !headers.id || !/^\d{9,11}$/.test(headers.timestamp) || !headers.signature) return false;
  if (Math.abs(nowSeconds - Number(headers.timestamp)) > TOLERANCE_SECONDS) return false;
  const given = headers.signature
    .split(" ")
    .map((part) => part.split(",", 2))
    .filter(([version, sig]) => version === "v1" && sig)
    .map(([, sig]) => sig);
  if (given.length === 0) return false;
  const content = `${headers.id}.${headers.timestamp}.${rawBody}`;
  for (const key of candidateKeys(secret)) {
    const expected = await hmacBase64(key, content);
    if (given.some((sig) => safeEqual(sig, expected))) return true;
  }
  return false;
}

/** 測試用：產生 webhook-signature 標頭（Standard Webhooks 金鑰）。 */
export async function signPolar(rawBody: string, id: string, timestamp: string, secret: string) {
  const [key] = candidateKeys(secret);
  return `v1,${await hmacBase64(key, `${id}.${timestamp}.${rawBody}`)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Loose = any;

export type ParsedPolarEvent = {
  type: string;
  /** 我們在建立結帳時放進 metadata 的訂單編號 */
  orderId: string;
  checkoutId: string;
  polarOrderId: string;
  paid: boolean;
  /** 折扣後、稅前金額（美分）。我們關掉折扣碼，所以應該等於方案價 × 100 */
  netAmount: number | null;
  refundedAmount: number | null;
  currency: string;
  /** order：purchase / subscription_create / subscription_cycle / subscription_update */
  billingReason: string;
  /** order.* 的 subscription_id，或 subscription.* 事件本身的 id */
  subscriptionId: string;
  customerId: string;
  /** 這一期的結束時間（order 帶的 subscription 物件，或 subscription.* 事件本身） */
  periodEnd: string;
  /** subscription.*：active / past_due / canceled / unpaid / incomplete 等 */
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  productId: string;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function parsePolarEvent(event: Loose): ParsedPolarEvent {
  const data: Loose = event?.data ?? {};
  const type = str(event?.type);
  const isSubscription = type.startsWith("subscription.");
  const subscription: Loose = isSubscription ? data : data?.subscription ?? {};
  return {
    type,
    orderId: str(data?.metadata?.sunui_order),
    checkoutId: str(data?.checkout_id),
    polarOrderId: isSubscription ? "" : str(data?.id),
    paid: data?.paid === true,
    netAmount: num(data?.net_amount),
    refundedAmount: num(data?.refunded_amount),
    currency: str(data?.currency).toLowerCase(),
    billingReason: str(data?.billing_reason),
    subscriptionId: isSubscription ? str(data?.id) : str(data?.subscription_id) || str(subscription?.id),
    customerId: str(data?.customer_id) || str(data?.customer?.id),
    periodEnd: str(subscription?.current_period_end),
    subscriptionStatus: isSubscription ? str(data?.status) : "",
    cancelAtPeriodEnd: subscription?.cancel_at_period_end === true,
    productId: str(data?.product_id) || str(data?.product?.id) || str(data?.items?.[0]?.product_id),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
