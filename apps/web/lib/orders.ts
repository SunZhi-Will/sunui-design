// 訂單與授權碼，存在 Upstash Redis（SHOPLINE 只負責收款，沒有訂單後台與授權碼）。
//
// order:{id}          hash：plan、amountTwd、email、status、createdAt、paidAt、sessionId、tradeId、licenseId、keyEnc、viewToken、refundedTwd
// orders              zset：createdAt → 訂單編號（後台列表）
// ordersession:{sid}  string：SHOPLINE sessionId → 訂單編號
// ordertrade:{tid}    string：SHOPLINE tradeOrderId → 訂單編號（退款、爭議的通知只帶這個）
// order:{id}:fulfill  string：入帳鎖（SET NX），重複的付款通知不會發兩把授權碼
// license:{hash}      hash：id、orderId、plan、status（active / revoked）、email、createdAt、display
// licid:{id}          string：授權 id → 授權碼雜湊
// licenses            zset：createdAt → 授權 id
// seats:founding      counter：已付款的 Founding 筆數（退款會扣回）
// webhook:log         list：最近 200 則付款通知的處理結果（不含個資）
//
// 訂單與授權不設過期：這是帳務資料。

import { displayKey, encryptLicenseKey, generateLicenseKey, hashLicenseKey } from "./license-key";
import { hashToStrings, pipeline, randomHex, type RedisCommand } from "./redis";
import type { WebhookIds } from "./shopline-core";
import { ORDER_PATTERN } from "./shopline-core";
import { pricesTwd, type Plan } from "./site";

/** 完成頁只對「發起結帳的那個瀏覽器」顯示授權碼：cookie 存訂單編號與 viewToken。 */
export const ORDER_COOKIE = "sunui_order";

export type OrderStatus = "pending" | "paid" | "refunded" | "amount_mismatch" | "disputed";

export type Order = {
  id: string;
  plan: Plan;
  amountTwd: number;
  email: string;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  sessionId?: string;
  tradeId?: string;
  licenseId?: string;
  keyEnc?: string;
  viewToken: string;
  refundedTwd?: number;
  /** 後台「測試 SHOPLINE 連線」建立的訂單，不算進統計 */
  test?: boolean;
};

export type License = {
  id: string;
  orderId: string;
  plan: Plan;
  status: "active" | "revoked";
  email: string;
  createdAt: string;
  display: string;
};

async function run(commands: RedisCommand[]) {
  const replies = await pipeline(commands);
  if (!replies) throw new Error("Redis is not configured");
  const failed = replies.find((r) => r.error);
  if (failed) throw new Error(`Redis error: ${failed.error}`);
  return replies;
}

function toOrder(raw: Record<string, string>): Order | null {
  if (!raw.id) return null;
  return {
    id: raw.id,
    plan: raw.plan as Plan,
    amountTwd: Number(raw.amountTwd),
    email: raw.email ?? "",
    status: raw.status as OrderStatus,
    createdAt: raw.createdAt,
    paidAt: raw.paidAt || undefined,
    sessionId: raw.sessionId || undefined,
    tradeId: raw.tradeId || undefined,
    licenseId: raw.licenseId || undefined,
    keyEnc: raw.keyEnc || undefined,
    viewToken: raw.viewToken ?? "",
    refundedTwd: raw.refundedTwd ? Number(raw.refundedTwd) : undefined,
    test: raw.test === "1",
  };
}

function toLicense(raw: Record<string, string>): License | null {
  if (!raw.id) return null;
  return {
    id: raw.id,
    orderId: raw.orderId,
    plan: raw.plan as Plan,
    status: raw.status as License["status"],
    email: raw.email ?? "",
    createdAt: raw.createdAt,
    display: raw.display,
  };
}

export async function createOrder(plan: Plan, email: string, options: { test?: boolean } = {}) {
  const order: Order = {
    id: `SU${randomHex(11)}`,
    plan,
    amountTwd: pricesTwd[plan],
    email: email.trim().toLowerCase(),
    status: "pending",
    createdAt: new Date().toISOString(),
    viewToken: randomHex(16),
    ...(options.test ? { test: true } : {}),
  };
  const fields = Object.entries(order).flatMap(([k, v]) => [k, k === "test" ? "1" : String(v)]);
  await run([
    ["HSET", `order:${order.id}`, ...fields],
    ["ZADD", "orders", Date.now(), order.id],
  ]);
  return order;
}

export async function attachSession(orderId: string, sessionId: string) {
  await run([
    ["HSET", `order:${orderId}`, "sessionId", sessionId],
    ["SET", `ordersession:${sessionId}`, orderId],
  ]);
}

export async function getOrder(id: string) {
  if (!ORDER_PATTERN.test(id)) return null;
  const [reply] = await run([["HGETALL", `order:${id}`]]);
  return toOrder(hashToStrings(reply.result));
}

/** 付款通知找訂單：先用 sessionId，再用我們的訂單編號，最後用 SHOPLINE 交易編號。 */
export async function findOrder(ids: WebhookIds) {
  if (ids.sessionId) {
    const [r] = await run([["GET", `ordersession:${ids.sessionId}`]]);
    if (typeof r.result === "string") return getOrder(r.result);
  }
  if (ORDER_PATTERN.test(ids.referenceOrderId)) {
    const order = await getOrder(ids.referenceOrderId);
    if (order) return order;
  }
  if (ids.tradeOrderId) {
    const [r] = await run([["GET", `ordertrade:${ids.tradeOrderId}`]]);
    if (typeof r.result === "string") return getOrder(r.result);
  }
  return null;
}

/**
 * 入帳：發一把授權碼、訂單標成已付款。用 SET NX 上鎖，重複的通知回 null（不會發第二把）。
 * secret 用來加密一份授權碼存在訂單裡，讓完成頁可以再顯示。
 */
export async function fulfillOrder(order: Order, tradeId: string, secret: string) {
  const [lock] = await run([["SET", `order:${order.id}:fulfill`, "1", "NX"]]);
  if (lock.result !== "OK") return null;

  const key = generateLicenseKey();
  const hash = await hashLicenseKey(key);
  const licenseId = `lic_${randomHex(8)}`;
  const now = new Date().toISOString();
  const license: License = {
    id: licenseId,
    orderId: order.id,
    plan: order.plan,
    status: "active",
    email: order.email,
    createdAt: now,
    display: displayKey(key),
  };
  const commands: RedisCommand[] = [
    ["HSET", `license:${hash}`, ...Object.entries(license).flatMap(([k, v]) => [k, String(v)])],
    ["SET", `licid:${licenseId}`, hash],
    ["ZADD", "licenses", Date.now(), licenseId],
    ["HSET", `order:${order.id}`, "status", "paid", "paidAt", now, "licenseId", licenseId, "keyEnc", await encryptLicenseKey(key, secret), ...(tradeId ? ["tradeId", tradeId] : [])],
  ];
  if (tradeId) commands.push(["SET", `ordertrade:${tradeId}`, order.id]);
  if (order.plan === "founding") commands.push(["INCR", "seats:founding"]);
  await run(commands);
  return { key, licenseId };
}

async function setLicenseStatus(licenseId: string | undefined, status: License["status"]) {
  if (!licenseId) return;
  const [r] = await run([["GET", `licid:${licenseId}`]]);
  if (typeof r.result === "string") await run([["HSET", `license:${r.result}`, "status", status]]);
}

/** 全額退款：訂單標成已退款、授權撤銷、Founding 名額扣回。部分退款或金額不明時只記下來，留給人看。 */
export async function refundOrder(order: Order, refunded: number | null) {
  if (order.status === "refunded") return "duplicate";
  if (refunded !== null) await run([["HSET", `order:${order.id}`, "refundedTwd", Math.round(refunded / 100)]]);
  if (order.status !== "paid" || refunded !== order.amountTwd * 100) return "refund_review";
  await run([
    ["HSET", `order:${order.id}`, "status", "refunded"],
    ...(order.plan === "founding" ? [["DECR", "seats:founding"] as RedisCommand] : []),
  ]);
  await setLicenseStatus(order.licenseId, "revoked");
  return "refunded";
}

/** 拒付（chargeback）：持卡人已經在要回這筆錢，授權先撤銷，訂單標成爭議中。 */
export async function disputeOrder(order: Order) {
  await run([["HSET", `order:${order.id}`, "status", "disputed"]]);
  await setLicenseStatus(order.licenseId, "revoked");
}

export async function markAmountMismatch(order: Order, tradeId: string) {
  await run([["HSET", `order:${order.id}`, "status", "amount_mismatch", ...(tradeId ? ["tradeId", tradeId] : [])]]);
}

export async function lookupLicense(key: string) {
  const [r] = await run([["HGETALL", `license:${await hashLicenseKey(key)}`]]);
  return toLicense(hashToStrings(r.result));
}

export async function foundingSold() {
  const [r] = await run([["GET", "seats:founding"]]);
  return Math.max(0, Number(r.result) || 0);
}

/** 最新的訂單（新的在前）。 */
export async function listOrders(limit = 500) {
  const [ids] = await run([["ZREVRANGE", "orders", 0, limit - 1]]);
  const list = Array.isArray(ids.result) ? ids.result.map(String) : [];
  if (list.length === 0) return [];
  const replies = await run(list.map((id) => ["HGETALL", `order:${id}`]));
  return replies.map((r) => toOrder(hashToStrings(r.result))).filter((o): o is Order => o !== null);
}

/** 最新的授權（新的在前）。 */
export async function listLicenses(limit = 1000) {
  const [ids] = await run([["ZREVRANGE", "licenses", 0, limit - 1]]);
  const list = Array.isArray(ids.result) ? ids.result.map(String) : [];
  if (list.length === 0) return [];
  const hashes = await run(list.map((id) => ["GET", `licid:${id}`]));
  const keys = hashes.map((h) => (typeof h.result === "string" ? h.result : "")).filter(Boolean);
  if (keys.length === 0) return [];
  const replies = await run(keys.map((hash) => ["HGETALL", `license:${hash}`]));
  return replies.map((r) => toLicense(hashToStrings(r.result))).filter((l): l is License => l !== null);
}

export type WebhookLogEntry = { at: string; type: string; order: string | null; result: string };

export async function logWebhook(entry: Omit<WebhookLogEntry, "at">) {
  try {
    await run([
      ["LPUSH", "webhook:log", JSON.stringify({ at: new Date().toISOString(), ...entry })],
      ["LTRIM", "webhook:log", 0, 199],
      ["HSET", "webhook:last", entry.type || "unknown", new Date().toISOString()],
    ]);
  } catch {
    // 記錄失敗不影響處理結果
  }
}

export async function webhookLog(limit = 50) {
  const [r] = await run([["LRANGE", "webhook:log", 0, limit - 1]]);
  return (Array.isArray(r.result) ? r.result : []).flatMap((line) => {
    try {
      return [JSON.parse(String(line)) as WebhookLogEntry];
    } catch {
      return [];
    }
  });
}
