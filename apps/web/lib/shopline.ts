// SHOPLINE Payments。兩條路：
// - 買斷：導轉式結帳（sessions/create，不綁卡）。請求格式照作者 VideoAligner 的 plusCheckout，已在 PostVault 用真實付款驗證過。
// - 月訂、年訂：內嵌式 SDK 綁卡付款（payment/create，paymentBehavior = CardBindPayment），之後每一期由 SunUI 的 cron
//   用存下來的卡扣款（paymentBehavior = Recurring，顧客不在場）。導轉式不能綁卡，所以訂閱一定走內嵌式。
//   文件：docs.shoplinepayments.com/guide/quick/。SHOPLINE 只提供「用存的卡扣一次」，排程、重試、取消都是 SunUI 自己做。
//
// 環境變數：SHOPLINE_MERCHANT_ID、SHOPLINE_API_KEY、SHOPLINE_SIGN_KEY（SunUI 這一列 webhook 專屬）、
// SHOPLINE_CLIENT_KEY（內嵌式 SDK 用，後台「設定 → 開發者管理」，不是秘密）、
// SHOPLINE_ENV（live 走正式環境；其他值走 sandbox；本機設 dev 會跳過 SHOPLINE 直接入帳）。

import type { Order } from "./orders";
import { randomHex, sha256 } from "./redis";
import { pricesTwd, type SubscriptionPlan } from "./site";
import { PRODUCT_PREFIX } from "./shopline-core";
import { siteUrl } from "./site";

const SANDBOX_BASE = "https://api-sandbox.shoplinepayments.com";
const LIVE_BASE = "https://api.shoplinepayments.com";

const PRODUCT_NAME: Record<Order["plan"], string> = {
  founding: `${PRODUCT_PREFIX} Pro Founding member (lifetime)`,
  pro: `${PRODUCT_PREFIX} Pro (lifetime)`,
  team: `${PRODUCT_PREFIX} Pro Team, 5 seats (lifetime)`,
  monthly: `${PRODUCT_PREFIX} Pro, 1 month`,
  yearly: `${PRODUCT_PREFIX} Pro, 1 year`,
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

/* ---------- 內嵌式綁卡與定期扣款（月訂、年訂） ---------- */

function baseUrl() {
  return process.env.SHOPLINE_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

/** 送給 SHOPLINE 的顧客編號：email 的雜湊，綁卡通知靠它對回授權。 */
export async function shoplineCustomerRef(email: string) {
  return (await sha256(email.trim().toLowerCase())).slice(0, 32);
}

/** 內嵌式 SDK 要的前端設定。clientKey 不是秘密。沒設定齊全時回 null（訂閱不能用新台幣付）。 */
export function shoplineSdkConfig() {
  const clientKey = process.env.SHOPLINE_CLIENT_KEY;
  const merchantId = process.env.SHOPLINE_MERCHANT_ID;
  if (!clientKey || !merchantId) return null;
  return { clientKey, merchantId, env: process.env.SHOPLINE_ENV === "live" ? ("production" as const) : ("sandbox" as const) };
}

/** 新台幣訂閱可以結帳：本機 dev 直接入帳，或 SDK 與 API 金鑰都齊全。 */
export function shoplineRecurringReady() {
  return devCheckout() || shoplineSdkConfig() !== null;
}

async function slpPost(path: string, body: unknown, idempotentKey?: string) {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      merchantId: process.env.SHOPLINE_MERCHANT_ID ?? "",
      apiKey: process.env.SHOPLINE_API_KEY ?? "",
      requestId: randomHex(16),
      ...(idempotentKey ? { idempotentKey: idempotentKey.slice(0, 32) } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as Loose;
  return { status: response.status, ok: response.ok, data };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Loose = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const text = (...values: unknown[]) => String(values.find((v) => typeof v === "string" && v) ?? "");

/** payment/create 的回應與付款通知都可能帶綁好的卡：會員 id 與卡片 id。 */
export function cardFromPayment(data: Loose) {
  const payment = data?.payment ?? data?.lastPayment ?? {};
  return {
    customerId: text(payment?.paymentCustomerId, data?.customer?.customerId, data?.customer?.CustomerId, data?.order?.customer?.customerId),
    instrumentId: text(payment?.paymentInstrument?.paymentInstrumentId, data?.paymentInstrument?.instrumentId),
  };
}

export type CardPaymentResult =
  | {
      ok: true;
      tradeOrderId: string;
      status: string;
      /** 交給前端 SDK 的 payment.pay(nextAction)，可能要走 3D 驗證 */
      nextAction: unknown;
      customerId: string;
      instrumentId: string;
    }
  | { ok: false; code: string };

function purchaseBody(params: {
  referenceOrderId: string;
  amountTwd: number;
  productId: string;
  productName: string;
  email: string;
  customerRef: string;
  clientIp: string;
  language: "zh-TW" | "en";
  returnUrl: string;
}) {
  const person = { lastName: "Customer", email: params.email };
  const address = { countryCode: "TW", street: "N/A" };
  const amount = { value: params.amountTwd * 100, currency: "TWD" };
  return {
    acquirerType: "SDK",
    referenceOrderId: params.referenceOrderId,
    amount,
    language: params.language,
    returnUrl: params.returnUrl,
    order: {
      products: [{ id: params.productId, name: params.productName, quantity: 1, amount }],
      shipping: { shippingMethod: "Digital", carrier: "None", personalInfo: person, address },
    },
    billing: { personalInfo: person, address },
    customer: { referenceCustomerId: params.customerRef, personalInfo: person },
    client: { ip: params.clientIp.slice(0, 32) },
  };
}

function parseCardPayment(result: { ok: boolean; status: number; data: Loose }, label: string): CardPaymentResult {
  const data = result.data;
  if (!result.ok || !data || typeof data.tradeOrderId !== "string") {
    const code = text(data?.code, data?.paymentMsg?.code) || String(result.status);
    console.error(`[shopline] ${label} ${result.status} ${code}`);
    return { ok: false, code };
  }
  const card = cardFromPayment(data);
  return { ok: true, tradeOrderId: data.tradeOrderId.slice(0, 64), status: text(data.status).toUpperCase(), nextAction: data.nextAction ?? null, ...card };
}

/**
 * 訂閱第一期：綁卡並付款（CardBindPayment）。paySession 是前端 SDK createPayment() 給的字串，原樣轉送。
 * 入帳一樣以 trade.succeeded 通知為準；這裡只回 nextAction 讓前端完成付款（含 3D 驗證）。
 */
export async function createCardBindPayment(order: Order, paySession: string, clientIp: string, language: "zh-TW" | "en") {
  try {
    const body = {
      ...purchaseBody({
        referenceOrderId: order.id,
        amountTwd: order.amountTwd,
        productId: order.plan,
        productName: PRODUCT_NAME[order.plan],
        email: order.email,
        customerRef: await shoplineCustomerRef(order.email),
        clientIp,
        language,
        returnUrl: `${siteUrl()}/api/checkout/return?o=${order.id}`,
      }),
      paySession,
      confirm: { paymentMethod: "CreditCard", paymentBehavior: "CardBindPayment", autoConfirm: false, paymentInstrument: { savePaymentInstrument: true } },
    };
    return parseCardPayment(await slpPost("/api/v1/trade/payment/create", body, order.id), "card bind payment");
  } catch {
    return { ok: false, code: "network" } as CardPaymentResult;
  }
}

/**
 * 換卡：只綁卡（CardBind，SHOPLINE 會做 NT$1 授權後自動取消）。新卡由 customer.instrument.binded 通知寫回授權。
 * reference 用 SC 開頭的編號，付款通知會被當成「不是訂單」略過。
 */
export async function createCardBind(email: string, paySession: string, clientIp: string, language: "zh-TW" | "en", returnUrl: string) {
  try {
    const reference = `SC${randomHex(11)}`;
    const body = {
      ...purchaseBody({
        referenceOrderId: reference,
        amountTwd: 1,
        productId: "card",
        productName: `${PRODUCT_PREFIX} Pro, update card`,
        email,
        customerRef: await shoplineCustomerRef(email),
        clientIp,
        language,
        returnUrl,
      }),
      paySession,
      confirm: { paymentMethod: "CreditCard", paymentBehavior: "CardBind", autoConfirm: false, paymentInstrument: { savePaymentInstrument: true } },
    };
    return parseCardPayment(await slpPost("/api/v1/trade/payment/create", body, reference), "card bind");
  } catch {
    return { ok: false, code: "network" } as CardPaymentResult;
  }
}

export type RecurringResult =
  | { outcome: "succeeded"; tradeOrderId: string }
  | { outcome: "processing"; tradeOrderId: string }
  | { outcome: "failed"; tradeOrderId: string; code: string };

/** 續扣一期：用存下來的卡扣款，顧客不在場（Recurring + autoConfirm）。本機 dev 模式直接當成功。 */
export async function chargeRecurring(
  order: Order,
  plan: SubscriptionPlan,
  card: { customerId: string; instrumentId: string },
  serverIp = "127.0.0.1",
): Promise<RecurringResult> {
  if (devCheckout()) return { outcome: "succeeded", tradeOrderId: "" };
  try {
    const body = {
      ...purchaseBody({
        referenceOrderId: order.id,
        amountTwd: pricesTwd[plan],
        productId: plan,
        productName: PRODUCT_NAME[plan],
        email: order.email,
        customerRef: await shoplineCustomerRef(order.email),
        clientIp: serverIp,
        language: "en",
        returnUrl: `${siteUrl()}/account`,
      }),
      paySession: "{}",
      confirm: {
        paymentMethod: "CreditCard",
        paymentBehavior: "Recurring",
        autoConfirm: true,
        paymentCustomerId: card.customerId,
        paymentInstrument: { paymentInstrumentId: card.instrumentId },
      },
    };
    const result = await slpPost("/api/v1/trade/payment/create", body, order.id);
    const data = result.data;
    const tradeOrderId = text(data?.tradeOrderId).slice(0, 64);
    const status = text(data?.status).toUpperCase();
    if (result.ok && status === "SUCCEEDED") return { outcome: "succeeded", tradeOrderId };
    if (result.ok && (status === "PROCESSING" || status === "CREATED" || status === "PENDING")) return { outcome: "processing", tradeOrderId };
    const code = text(data?.paymentMsg?.code, data?.code) || status || String(result.status);
    console.error(`[shopline] recurring ${result.status} ${code}`);
    return { outcome: "failed", tradeOrderId, code };
  } catch {
    // 逾時：不知道有沒有扣到。當成處理中，等付款通知；同一期的重試鎖會擋住重複扣款
    return { outcome: "processing", tradeOrderId: "" };
  }
}

/** 解除綁定的卡（取消到期、換卡後的舊卡）。失敗只記錄，不影響授權。 */
export async function unbindCard(customerId: string, instrumentId: string) {
  if (devCheckout() || !customerId || !instrumentId || customerId === "dev") return true;
  try {
    const result = await slpPost("/api/v1/customer/paymentInstrument/unbind", { customerId, paymentInstrumentId: instrumentId });
    if (!result.ok) console.error(`[shopline] unbind ${result.status}`);
    return result.ok;
  } catch {
    return false;
  }
}
