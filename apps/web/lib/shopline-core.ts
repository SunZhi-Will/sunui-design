// SHOPLINE Payments 的純邏輯：通知驗簽、通知欄位解析。沒有 I/O，方便單元測試。
// 格式照作者 VideoAligner（lib/shopline.ts）與 PostVault 用真實付款驗證過的版本：
// - 通知標頭 timestamp 與 sign，sign = HMAC-SHA256(`${timestamp}.${原始本文}`, signKey)，十六進位與 base64 都可能
// - 通知本文的形狀不固定，欄位一律當未知值逐層取
// - 同一個商家帳號底下還有 PostVault、課程平台、萬寶箱，別家的訂單要辨認出來、回 200 不重送

/** SunUI 的訂單編號：SU + 22 位十六進位。別家的格式不同（萬寶箱是 KT）。 */
export const ORDER_PATTERN = /^SU[0-9a-f]{22}$/;
/** 送給 SHOPLINE 的商品名稱前綴，用來辨認同商家其他產品的通知。 */
export const PRODUCT_PREFIX = "SunUI";

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(key: string, content: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(content));
}

export async function verifyShoplineSignature(rawBody: string, timestamp: string, sign: string, signKey: string) {
  const given = sign.trim();
  if (!signKey || !/^\d{10,14}$/.test(timestamp) || !given) return false;
  const digest = await hmac(signKey, `${timestamp}.${rawBody}`);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return safeEqual(hex(digest), given.toLowerCase()) || safeEqual(base64, given);
}

/** 測試用：產生 sign 標頭（十六進位）。 */
export async function signShopline(rawBody: string, timestamp: string, signKey: string) {
  return hex(await hmac(signKey, `${timestamp}.${rawBody}`));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Loose = any;

function pickString(...values: unknown[]) {
  return String(values.find((v) => typeof v === "string" && v) ?? "");
}

function pickNumber(...values: unknown[]) {
  const found = values.find((v) => typeof v === "number" || (typeof v === "string" && /^\d+$/.test(v)));
  return found === undefined ? null : Number(found);
}

export type WebhookIds = { sessionId: string; referenceOrderId: string; tradeOrderId: string };

export type ParsedWebhook = {
  id: string;
  type: string;
  ids: WebhookIds;
  /** 付款金額（SHOPLINE 的單位：新台幣 × 100） */
  paid: number | null;
  /** 退款金額（同上） */
  refunded: number | null;
  /** 通知帶了商品名稱、而且都不是 SunUI 的 */
  foreignProduct: boolean;
};

export function parseWebhook(event: Loose): ParsedWebhook {
  const data: Loose = event?.data ?? {};
  const products: Loose = data?.order?.products ?? data?.products;
  const names = Array.isArray(products) ? products.map((p: Loose) => p?.name).filter((n: unknown) => typeof n === "string" && n) : [];
  return {
    id: pickString(event?.id),
    type: pickString(event?.type),
    ids: {
      sessionId: pickString(data?.sessionId, data?.order?.sessionId),
      referenceOrderId: pickString(data?.referenceOrderId, data?.order?.referenceOrderId, data?.referenceId, data?.order?.referenceId),
      tradeOrderId: pickString(data?.tradeOrderId, data?.order?.tradeOrderId),
    },
    paid: pickNumber(data?.payment?.paidAmount?.value, data?.order?.payment?.paidAmount?.value, data?.order?.amount?.value, data?.amount?.value),
    refunded: pickNumber(data?.refund?.amount?.value, data?.amount?.value),
    foreignProduct: names.length > 0 && !names.some((n: string) => n.startsWith(PRODUCT_PREFIX)),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** 付款成功與退款的通知不帶商品名稱：訂單編號存在但不是 SunUI 的格式，就是別家的。 */
export function isForeignReference(ids: WebhookIds) {
  return ids.referenceOrderId !== "" && !ORDER_PATTERN.test(ids.referenceOrderId);
}
