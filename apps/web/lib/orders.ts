// 訂單與授權碼，存在 Upstash Redis（SHOPLINE 只負責收款，沒有訂單後台與授權碼）。
//
// order:{id}          hash：plan、amountTwd、email、status、createdAt、paidAt、sessionId、tradeId、licenseId、keyEnc、viewToken、refundedTwd、
//                     renewal（1 = 延長既有訂閱）、periodEnd（訂閱：這筆付款後授權的到期時間）、recurring（1 = 自動續扣的那一期）、
//                     licenseIds、seatKeysEnc（Team：5 個席位各一把授權碼，逗號分隔的 id 與加密的 JSON 陣列）、
//                     provider（shopline / polar，沒有這欄的舊訂單是 shopline）、amountUsd（polar 訂單的美金金額，此時 amountTwd 為 0）
// orders              zset：createdAt → 訂單編號（後台列表）
// ordersession:{sid}  string：SHOPLINE sessionId 或 Polar checkout id → 訂單編號
// ordertrade:{tid}    string：SHOPLINE tradeOrderId → 訂單編號（退款、爭議的通知只帶這個）
// order:{id}:fulfill  string：入帳鎖（SET NX），重複的付款通知不會發兩把授權碼
// license:{hash}      hash：id、orderId、plan、status（active / revoked）、email、createdAt、display、
//                     expiresAt（只有訂閱有）、remindedFor（已寄過到期提醒的 expiresAt）、seat（Team 的席位編號）、
//                     autoRenew（1 = 到期自動扣款，0 = 已取消）、renewVia（polar / shopline）、polarSubscription、polarCustomer、
//                     slpCustomer、slpInstrument（SHOPLINE 會員 id 與綁定的卡）、chargeFails、lastChargeAt、pastDueSince
// licid:{id}          string：授權 id → 授權碼雜湊
// licenses            zset：createdAt → 授權 id
// licsub:{emailHash}  string：email → 這個人的訂閱授權 id。再買一期就延長這把，授權碼不變
// polarsub:{subId}    string：Polar 訂閱 id → 授權 id（續扣的 order 用這個找授權）
// charge:{lic}:{exp}:{n} string：SHOPLINE 續扣鎖（SET NX），同一期同一次重試不會扣兩次
// seats:founding      counter：已付款的 Founding 筆數（退款會扣回）
// webhook:log         list：最近 200 則付款通知的處理結果（不含個資）
//
// 訂單與授權不設過期：這是帳務資料。訂閱的「到期」是授權上的 expiresAt，不是 Redis TTL。

import { decryptLicenseKey, displayKey, encryptLicenseKey, generateLicenseKey, hashLicenseKey } from "./license-key";
import { hashToStrings, pipeline, randomHex, sha256, type RedisCommand } from "./redis";
import type { WebhookIds } from "./shopline-core";
import { ORDER_PATTERN } from "./shopline-core";
import { addTerm, isSubscription, prices, pricesTwd, type Plan } from "./site";
import { licenseExpired } from "./subscription-core";

/** 完成頁只對「發起結帳的那個瀏覽器」顯示授權碼：cookie 存訂單編號與 viewToken。 */
export const ORDER_COOKIE = "sunui_order";

export type OrderStatus = "pending" | "paid" | "refunded" | "amount_mismatch" | "disputed" | "failed";

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
  /** 訂閱續約：延長了既有授權，沒有發新的授權碼 */
  renewal?: boolean;
  /** 訂閱：這筆付款之後授權的到期時間 */
  periodEnd?: string;
  /** 自動續扣產生的訂單（不是客戶自己結帳的） */
  recurring?: boolean;
  /** Team：每個席位一把授權碼，依席位順序（licenseId / keyEnc 是第 1 席，向下相容） */
  licenseIds?: string[];
  /** Team：所有席位授權碼的加密 JSON 陣列 */
  seatKeysEnc?: string;
  /** 收款方：SHOPLINE（新台幣）或 Polar（美金） */
  provider: Provider;
  /** Polar 訂單的美金金額（整數美元）；SHOPLINE 訂單沒有 */
  amountUsd?: number;
};

export type Provider = "shopline" | "polar";

/** 訂單應收金額，用該幣別的最小單位（新台幣 × 100、美分），付款與退款通知都用這個比對。 */
export function expectedMinor(order: Pick<Order, "provider" | "amountTwd" | "amountUsd">) {
  return order.provider === "polar" ? (order.amountUsd ?? 0) * 100 : order.amountTwd * 100;
}

/** 後台與信件顯示用：NT$4,090 或 US$129。 */
export function orderAmountLabel(order: Pick<Order, "provider" | "amountTwd" | "amountUsd">) {
  return order.provider === "polar" ? `US$${(order.amountUsd ?? 0).toLocaleString("en-US")}` : `NT$${order.amountTwd.toLocaleString("en-US")}`;
}

/** 分幣別加總（後台銷售額）。 */
export function sumByCurrency(orders: Pick<Order, "provider" | "amountTwd" | "amountUsd">[]) {
  return orders.reduce(
    (sum, o) => (o.provider === "polar" ? { ...sum, usd: sum.usd + (o.amountUsd ?? 0) } : { ...sum, twd: sum.twd + o.amountTwd }),
    { twd: 0, usd: 0 },
  );
}

export type License = {
  id: string;
  orderId: string;
  plan: Plan;
  status: "active" | "revoked";
  email: string;
  createdAt: string;
  display: string;
  /** 訂閱的到期時間；買斷沒有 */
  expiresAt?: string;
  remindedFor?: string;
  /** Team 的席位編號（1 起算） */
  seat?: number;
  /** 疑似分享：最近一次一天內超過 10 個 IP 的日期與 IP 數 */
  shareAlertDay?: string;
  shareIps?: number;
  /** 訂閱：true = 到期自動扣款；false = 客戶已取消，用到這期結束；沒有這欄 = 舊的預付制授權 */
  autoRenew?: boolean;
  renewVia?: Provider;
  polarSubscription?: string;
  polarCustomer?: string;
  /** SHOPLINE 會員 id（paymentCustomerId）與綁定的卡（paymentInstrumentId） */
  slpCustomer?: string;
  slpInstrument?: string;
  /** SHOPLINE 續扣：這一期已經失敗幾次、最近一次嘗試的時間 */
  chargeFails?: number;
  lastChargeAt?: string;
  /** 扣款失敗、還在寬限期內 */
  pastDueSince?: string;
};

// 自動續扣的純判斷放在 subscription-core.ts（沒有 I/O，單元測試直接引用）
export { chargeDue, GRACE_MS, licenseExpired, MAX_CHARGE_ATTEMPTS, renewalGaveUp, RETRY_GAPS_MS } from "./subscription-core";

/** 一筆訂單發出的所有授權 id（Team 有多把）。 */
export function orderLicenseIds(order: Pick<Order, "licenseId" | "licenseIds">) {
  if (order.licenseIds?.length) return order.licenseIds;
  return order.licenseId ? [order.licenseId] : [];
}


async function subscriptionKey(email: string) {
  return `licsub:${(await sha256(`licsub:${email.trim().toLowerCase()}`)).slice(0, 32)}`;
}

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
    renewal: raw.renewal === "1",
    periodEnd: raw.periodEnd || undefined,
    licenseIds: raw.licenseIds ? raw.licenseIds.split(",").filter(Boolean) : undefined,
    seatKeysEnc: raw.seatKeysEnc || undefined,
    provider: raw.provider === "polar" ? "polar" : "shopline",
    amountUsd: raw.amountUsd ? Number(raw.amountUsd) : undefined,
    recurring: raw.recurring === "1",
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
    expiresAt: raw.expiresAt || undefined,
    remindedFor: raw.remindedFor || undefined,
    seat: raw.seat ? Number(raw.seat) : undefined,
    shareAlertDay: raw.shareAlertDay || undefined,
    shareIps: raw.shareIps ? Number(raw.shareIps) : undefined,
    autoRenew: raw.autoRenew === "1" ? true : raw.autoRenew === "0" ? false : undefined,
    renewVia: raw.renewVia === "polar" || raw.renewVia === "shopline" ? raw.renewVia : undefined,
    polarSubscription: raw.polarSubscription || undefined,
    polarCustomer: raw.polarCustomer || undefined,
    slpCustomer: raw.slpCustomer || undefined,
    slpInstrument: raw.slpInstrument || undefined,
    chargeFails: raw.chargeFails ? Number(raw.chargeFails) : undefined,
    lastChargeAt: raw.lastChargeAt || undefined,
    pastDueSince: raw.pastDueSince || undefined,
  };
}

export async function createOrder(plan: Plan, email: string, options: { test?: boolean; provider?: Provider; recurring?: boolean } = {}) {
  const provider = options.provider ?? "shopline";
  const order: Order = {
    id: `SU${randomHex(11)}`,
    plan,
    provider,
    // Polar 收美金：台幣金額記 0，銷售額才不會重複計算
    amountTwd: provider === "polar" ? 0 : pricesTwd[plan],
    ...(provider === "polar" ? { amountUsd: prices[plan] } : {}),
    email: email.trim().toLowerCase(),
    status: "pending",
    createdAt: new Date().toISOString(),
    viewToken: randomHex(16),
    ...(options.test ? { test: true } : {}),
    ...(options.recurring ? { recurring: true } : {}),
  };
  const fields = Object.entries(order).flatMap(([k, v]) => [k, k === "test" || k === "recurring" ? "1" : String(v)]);
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
export type Fulfilled = {
  /** 授權碼原文。續約時從原訂單解密取得，解不開（換過 SUNUI_ADMIN_TOKEN）時是 null */
  key: string | null;
  licenseId: string;
  renewal: boolean;
  expiresAt?: string;
  /** Team：所有席位的授權碼（第 1 把同 key） */
  seatKeys?: string[];
};

/** 解開 Team 訂單的所有席位授權碼；不是 Team 或解不開時回 null。 */
export async function decryptSeatKeys(order: Pick<Order, "seatKeysEnc">, secret: string) {
  if (!order.seatKeysEnc) return null;
  const plain = await decryptLicenseKey(order.seatKeysEnc, secret);
  try {
    const keys = plain ? (JSON.parse(plain) as unknown) : null;
    return Array.isArray(keys) && keys.every((k) => typeof k === "string") ? (keys as string[]) : null;
  } catch {
    return null;
  }
}

/** 產生一把授權並回傳寫入 Redis 的指令（還沒執行）。 */
async function newLicense(fields: Omit<License, "id" | "display" | "status" | "createdAt">, now: string) {
  const key = generateLicenseKey();
  const hash = await hashLicenseKey(key);
  const license: License = { id: `lic_${randomHex(8)}`, status: "active", createdAt: now, display: displayKey(key), ...fields };
  const commands: RedisCommand[] = [
    ["HSET", `license:${hash}`, ...Object.entries(license).flatMap(([k, v]) => (v === undefined ? [] : [k, String(v)]))],
    ["SET", `licid:${license.id}`, hash],
    ["ZADD", "licenses", Date.now(), license.id],
  ];
  return { key, license, commands };
}

/** 依授權 id 取授權（連同雜湊，續約要寫回去）。 */
async function licenseById(licenseId: string) {
  const [h] = await run([["GET", `licid:${licenseId}`]]);
  if (typeof h.result !== "string") return null;
  const [r] = await run([["HGETALL", `license:${h.result}`]]);
  const license = toLicense(hashToStrings(r.result));
  return license ? { license, hash: h.result } : null;
}

/**
 * 入帳：訂單標成已付款，並發授權。用 SET NX 上鎖，重複的通知回 null（不會發第二把）。
 * 訂閱方案：同一個 email 已經有沒被撤銷的訂閱授權時，延長那一把（從目前到期日或現在，取較晚的往後加一期），
 * 授權碼不變，客戶不用改 .env.local。
 * secret 用來加密一份授權碼存在訂單裡，讓完成頁可以再顯示。
 */
export async function fulfillOrder(
  order: Order,
  tradeId: string,
  secret: string,
  options: { periodEnd?: string } = {},
): Promise<Fulfilled | null> {
  const [lock] = await run([["SET", `order:${order.id}:fulfill`, "1", "NX"]]);
  if (lock.result !== "OK") return null;

  const nowDate = new Date();
  const now = nowDate.toISOString();
  const paidFields = ["status", "paid", "paidAt", now, ...(tradeId ? ["tradeId", tradeId] : [])];
  const tradeIndex: RedisCommand[] = tradeId ? [["SET", `ordertrade:${tradeId}`, order.id]] : [];

  if (isSubscription(order.plan)) {
    const subKey = await subscriptionKey(order.email);
    const [existingId] = await run([["GET", subKey]]);
    const existing = typeof existingId.result === "string" ? await licenseById(existingId.result) : null;
    if (existing && existing.license.status === "active") {
      const current = existing.license.expiresAt ? new Date(existing.license.expiresAt) : nowDate;
      // 自動續扣：從原本的到期日往後加一期（寬限期內晚幾天扣到，帳期也不會漂移）；
      // 客戶自己結帳：從到期日或現在，取較晚的往後加。Polar 給了這期的結束時間就用它，和 Polar 的帳期一致
      const base = order.recurring || current > nowDate ? current : nowDate;
      const computed = addTerm(order.plan, base);
      const given = options.periodEnd ? new Date(options.periodEnd) : null;
      const expiresAt = (given && !Number.isNaN(given.getTime()) && given > current ? given : computed).toISOString();
      const original = await getOrder(existing.license.orderId);
      const keyEnc = original?.keyEnc ?? "";
      await run([
        // 方案跟著最新一期走（月訂改年訂時後台顯示年訂）
        ["HSET", `license:${existing.hash}`, "expiresAt", expiresAt, "plan", order.plan, "chargeFails", 0],
        ["HDEL", `license:${existing.hash}`, "pastDueSince", "lastChargeAt"],
        ["HSET", `order:${order.id}`, ...paidFields, "licenseId", existing.license.id, "renewal", "1", "periodEnd", expiresAt, ...(keyEnc ? ["keyEnc", keyEnc] : [])],
        ...tradeIndex,
      ]);
      return {
        key: keyEnc ? await decryptLicenseKey(keyEnc, secret) : null,
        licenseId: existing.license.id,
        renewal: true,
        expiresAt,
      };
    }
  }

  // Team：每個席位一把授權碼，各自計算用量、可以單獨撤銷重發
  if (order.plan === "team") {
    const seats = await Promise.all(
      Array.from({ length: prices.teamSeats }, (_, i) =>
        newLicense({ orderId: order.id, plan: order.plan, email: order.email, seat: i + 1 }, now),
      ),
    );
    const keys = seats.map((s) => s.key);
    const ids = seats.map((s) => s.license.id);
    await run([
      ...seats.flatMap((s) => s.commands),
      [
        "HSET",
        `order:${order.id}`,
        ...paidFields,
        "licenseId", ids[0],
        "keyEnc", await encryptLicenseKey(keys[0], secret),
        "licenseIds", ids.join(","),
        "seatKeysEnc", await encryptLicenseKey(JSON.stringify(keys), secret),
      ],
      ...tradeIndex,
    ]);
    return { key: keys[0], licenseId: ids[0], renewal: false, seatKeys: keys };
  }

  const given = options.periodEnd ? new Date(options.periodEnd) : null;
  const expiresAt = isSubscription(order.plan)
    ? (given && !Number.isNaN(given.getTime()) && given > nowDate ? given : addTerm(order.plan, nowDate)).toISOString()
    : undefined;
  const { key, license, commands } = await newLicense({ orderId: order.id, plan: order.plan, email: order.email, expiresAt }, now);
  const licenseId = license.id;
  commands.push(
    ["HSET", `order:${order.id}`, ...paidFields, "licenseId", licenseId, "keyEnc", await encryptLicenseKey(key, secret), ...(expiresAt ? ["periodEnd", expiresAt] : [])],
    ...tradeIndex,
  );
  if (expiresAt) commands.push(["SET", await subscriptionKey(order.email), licenseId]);
  if (order.plan === "founding") commands.push(["INCR", "seats:founding"]);
  await run(commands);
  return { key, licenseId, renewal: false, expiresAt };
}

/**
 * 撤銷一把授權並發一把新的取代它（同訂單、同方案、同到期日、同席位）。
 * 用在 Team 成員離職，或發現授權碼外流。訂單裡的加密授權碼一起換掉，完成頁會顯示新的。
 */
export async function reissueLicense(licenseId: string, secret: string) {
  const found = await licenseById(licenseId);
  if (!found || found.license.status !== "active") return null;
  const old = found.license;
  const order = await getOrder(old.orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  const { key, license, commands } = await newLicense(
    { orderId: old.orderId, plan: old.plan, email: old.email, expiresAt: old.expiresAt, seat: old.seat },
    now,
  );
  commands.push(["HSET", `license:${found.hash}`, "status", "revoked"]);

  const orderFields: (string | number)[] = [];
  const ids = orderLicenseIds(order);
  const index = ids.indexOf(old.id);
  if (order.licenseIds?.length && index >= 0) {
    const nextIds = [...ids];
    nextIds[index] = license.id;
    orderFields.push("licenseIds", nextIds.join(","));
    const keys = await decryptSeatKeys(order, secret);
    if (keys && keys.length === ids.length) {
      keys[index] = key;
      orderFields.push("seatKeysEnc", await encryptLicenseKey(JSON.stringify(keys), secret));
    }
  }
  if (order.licenseId === old.id) orderFields.push("licenseId", license.id, "keyEnc", await encryptLicenseKey(key, secret));
  if (orderFields.length) commands.push(["HSET", `order:${order.id}`, ...orderFields]);
  // 訂閱：續約要找到新的這一把
  if (old.expiresAt) {
    const subKey = await subscriptionKey(old.email);
    const [current] = await run([["GET", subKey]]);
    if (current.result === old.id) commands.push(["SET", subKey, license.id]);
  }
  await run(commands);
  return { key, license, old, order };
}

async function setLicenseStatus(licenseId: string | undefined, status: License["status"]) {
  if (!licenseId) return;
  const [r] = await run([["GET", `licid:${licenseId}`]]);
  if (typeof r.result === "string") await run([["HSET", `license:${r.result}`, "status", status]]);
}

/**
 * 全額退款：訂單標成已退款、Founding 名額扣回。部分退款或金額不明時只記下來，留給人看。
 * 買斷：授權撤銷。訂閱：到期日往回扣一期（退的是續約那一期時，前面已付的期間照常有效；
 * 退的是唯一一期時，扣完就等於已到期）。
 */
export async function refundOrder(order: Order, refunded: number | null) {
  if (order.status === "refunded") return "duplicate";
  if (refunded !== null) await run([["HSET", `order:${order.id}`, "refundedTwd", Math.round(refunded / 100)]]);
  if (order.status !== "paid" || refunded === null || refunded < expectedMinor(order)) return "refund_review";
  await run([
    ["HSET", `order:${order.id}`, "status", "refunded"],
    ...(order.plan === "founding" ? [["DECR", "seats:founding"] as RedisCommand] : []),
  ]);
  if (isSubscription(order.plan) && order.licenseId) {
    const found = await licenseById(order.licenseId);
    if (found?.license.expiresAt) {
      const shortened = addTerm(order.plan, new Date(found.license.expiresAt), -1).toISOString();
      await run([["HSET", `license:${found.hash}`, "expiresAt", shortened]]);
    }
    return "refunded";
  }
  for (const id of orderLicenseIds(order)) await setLicenseStatus(id, "revoked");
  return "refunded";
}

/**
 * 到期前通知：expiresAt 落在 [now, now + withinMs) 而且這個到期日還沒通知過的訂閱授權。
 * 寄哪一種信由呼叫端依 autoRenew 決定（將自動扣款 / 將結束 / 舊的預付制提醒）。
 */
export async function licensesToRemind(withinMs: number, now = new Date()) {
  const all = await listLicenses(5000);
  return all.filter((l) => {
    if (l.status !== "active" || !l.expiresAt || l.remindedFor === l.expiresAt) return false;
    const left = new Date(l.expiresAt).getTime() - now.getTime();
    return left > 0 && left < withinMs;
  });
}

export async function markReminded(license: License) {
  const found = await licenseById(license.id);
  if (found && license.expiresAt) await run([["HSET", `license:${found.hash}`, "remindedFor", license.expiresAt]]);
}

/** 拒付（chargeback）：持卡人已經在要回這筆錢，授權先撤銷，訂單標成爭議中。 */
export async function disputeOrder(order: Order) {
  await run([["HSET", `order:${order.id}`, "status", "disputed"]]);
  for (const id of orderLicenseIds(order)) await setLicenseStatus(id, "revoked");
}

export async function markAmountMismatch(order: Order, tradeId: string) {
  await run([["HSET", `order:${order.id}`, "status", "amount_mismatch", ...(tradeId ? ["tradeId", tradeId] : [])]]);
}

/**
 * 標記疑似分享：同一把授權碼今天的 IP 數過了通知門檻。每把每天只標記一次（SET NX），
 * 第一次標記時回傳授權（給呼叫端寄通知），重複的回 null。
 */
export async function flagSharing(key: string, ips: number, day: string) {
  const hash = await hashLicenseKey(key);
  const [lock] = await run([["SET", `sharealert:${hash.slice(0, 32)}:${day}`, "1", "NX", "EX", 2 * 24 * 60 * 60]]);
  if (lock.result !== "OK") return null;
  const [, r] = await run([
    ["HSET", `license:${hash}`, "shareAlertDay", day, "shareIps", ips],
    ["HGETALL", `license:${hash}`],
  ]);
  return toLicense(hashToStrings(r.result));
}

export async function lookupLicense(key: string) {
  const [r] = await run([["HGETALL", `license:${await hashLicenseKey(key)}`]]);
  return toLicense(hashToStrings(r.result));
}

export async function foundingSold() {
  const [r] = await run([["GET", "seats:founding"]]);
  return Math.max(0, Number(r.result) || 0);
}

/** 訂單總數（含未付款與測試）。 */
export async function countOrders() {
  const [r] = await run([["ZCARD", "orders"]]);
  return Number(r.result) || 0;
}

/**
 * 全部訂單（新的在前），每批 500 筆分次讀。後台的累計數字用這個：
 * 每次結帳頁送出 email 都會建立一筆訂單（含放棄付款的），只看最近 500 筆會讓舊的已付款訂單掉出統計。
 */
export async function listAllOrders(batch = 500) {
  const all: Order[] = [];
  for (let start = 0; ; start += batch) {
    const [ids] = await run([["ZREVRANGE", "orders", start, start + batch - 1]]);
    const list = Array.isArray(ids.result) ? ids.result.map(String) : [];
    if (list.length === 0) break;
    const replies = await run(list.map((id) => ["HGETALL", `order:${id}`]));
    for (const r of replies) {
      const order = toOrder(hashToStrings(r.result));
      if (order) all.push(order);
    }
    if (list.length < batch) break;
  }
  return all;
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

/* ---------- 自動續扣 ---------- */

export async function getLicense(licenseId: string) {
  return (await licenseById(licenseId))?.license ?? null;
}

async function setLicenseFields(licenseId: string, fields: Record<string, string | number>, remove: string[] = []) {
  const found = await licenseById(licenseId);
  if (!found) return null;
  const commands: RedisCommand[] = [];
  const entries = Object.entries(fields).flat();
  if (entries.length) commands.push(["HSET", `license:${found.hash}`, ...entries]);
  if (remove.length) commands.push(["HDEL", `license:${found.hash}`, ...remove]);
  if (commands.length) await run(commands);
  return found.license;
}

/** 這個 email 目前的訂閱授權（沒有或已撤銷回 null）。 */
export async function subscriptionLicenseFor(email: string) {
  const [r] = await run([["GET", await subscriptionKey(email)]]);
  if (typeof r.result !== "string") return null;
  const license = await getLicense(r.result);
  return license && license.status === "active" ? license : null;
}

/** 這個 email 已經有自動續扣中、還沒過期的訂閱：再結帳一次會變成兩份扣款，結帳頁要擋下來。 */
export async function hasActiveAutoRenew(email: string, now = new Date()) {
  const license = await subscriptionLicenseFor(email);
  return Boolean(license?.autoRenew && !licenseExpired(license, now));
}

/** Polar 訂閱第一期入帳後：記下訂閱 id，之後的續扣靠它找到授權。 */
export async function linkPolarSubscription(licenseId: string, subscriptionId: string, customerId: string) {
  await setLicenseFields(licenseId, {
    autoRenew: "1",
    renewVia: "polar",
    polarSubscription: subscriptionId,
    ...(customerId ? { polarCustomer: customerId } : {}),
  });
  await run([["SET", `polarsub:${subscriptionId}`, licenseId]]);
}

export async function licenseForPolarSubscription(subscriptionId: string) {
  if (!subscriptionId) return null;
  const [r] = await run([["GET", `polarsub:${subscriptionId}`]]);
  return typeof r.result === "string" ? getLicense(r.result) : null;
}

/** SHOPLINE 第一期綁卡付款成功（或換卡成功）：記下會員 id 與卡片 id，到期由 cron 扣款。 */
export async function enableShoplineRenewal(licenseId: string, customerId: string, instrumentId: string) {
  await setLicenseFields(licenseId, { autoRenew: "1", renewVia: "shopline", slpCustomer: customerId, slpInstrument: instrumentId });
}

/** 取消自動續扣：到期日不動，用到這期結束。 */
export async function setAutoRenew(licenseId: string, on: boolean) {
  return setLicenseFields(licenseId, { autoRenew: on ? "1" : "0" });
}

/** 扣款失敗：記下第一次失敗的時間（寬限期從到期日算，這個只給信件與後台看）。 */
export async function markPastDue(licenseId: string, now = new Date()) {
  const license = await getLicense(licenseId);
  if (!license || license.pastDueSince) return license;
  return setLicenseFields(licenseId, { pastDueSince: now.toISOString() });
}

/** 訂閱結束（取消到期、重試全部失敗、Polar revoked）：不再續扣，寬限期立刻結束。 */
export async function endSubscription(licenseId: string, now = new Date()) {
  const license = await getLicense(licenseId);
  if (!license) return null;
  const fields: Record<string, string> = { autoRenew: "0" };
  if (license.expiresAt && new Date(license.expiresAt) > now) fields.expiresAt = now.toISOString();
  return setLicenseFields(licenseId, fields, ["pastDueSince"]);
}

export async function recordChargeAttempt(licenseId: string, failed: boolean, now = new Date()) {
  const license = await getLicense(licenseId);
  if (!license) return null;
  return setLicenseFields(licenseId, {
    lastChargeAt: now.toISOString(),
    ...(failed ? { chargeFails: (license.chargeFails ?? 0) + 1, ...(license.pastDueSince ? {} : { pastDueSince: now.toISOString() }) } : {}),
  });
}

/** SHOPLINE 續扣鎖：同一期的第 n 次嘗試只會跑一次（兩個 cron 同時跑也不會扣兩次）。 */
export async function lockCharge(license: License) {
  const [r] = await run([["SET", `charge:${license.id}:${license.expiresAt}:${license.chargeFails ?? 0}`, "1", "NX", "EX", 2 * 24 * 60 * 60]]);
  return r.result === "OK";
}

export async function markOrderFailed(order: Order, tradeId: string) {
  await run([["HSET", `order:${order.id}`, "status", "failed", ...(tradeId ? ["tradeId", tradeId] : [])]]);
}

/** 收款方的交易編號只入帳一次（續扣的 order 沒有我們的訂單編號，靠這個擋重送）。 */
export async function claimTrade(provider: Provider, tradeId: string) {
  const [r] = await run([["SET", `tradeclaim:${provider}:${tradeId}`, "1", "NX"]]);
  return r.result === "OK";
}

export async function releaseTrade(provider: Provider, tradeId: string) {
  await run([["DEL", `tradeclaim:${provider}:${tradeId}`]]);
}

/**
 * Polar 訂閱在入口改了方案：授權的方案跟著換。到期日不在這裡動：Polar 換帳期時還沒扣到錢，
 * 到期日只跟著扣款成功的 order.paid 走。
 */
export async function syncSubscriptionPlan(licenseId: string, plan: Plan | null) {
  const license = await getLicense(licenseId);
  if (!license || !plan || !isSubscription(plan) || plan === license.plan) return license;
  return setLicenseFields(licenseId, { plan });
}

/* ---------- SHOPLINE 綁卡對回授權 ---------- */
// slpref:{customerRef}      string：SHOPLINE 顧客編號（email 雜湊）→ 授權 id。入帳後才有
// slppending:{customerRef}  string：入帳前先到的綁卡結果（JSON：customerId、instrumentId），1 天後過期

/**
 * 收到綁好的卡（付款回應、trade.succeeded、customer.instrument.binded 都可能先到）：
 * 已經知道是哪一把授權就直接啟用續扣（換卡時回傳舊卡讓呼叫端解除綁定），還不知道就先暫存。
 */
export async function rememberShoplineCard(customerRef: string, customerId: string, instrumentId: string) {
  if (!customerRef || !customerId || !instrumentId) return null;
  const [r] = await run([["GET", `slpref:${customerRef}`]]);
  if (typeof r.result !== "string") {
    await run([["SET", `slppending:${customerRef}`, JSON.stringify({ customerId, instrumentId }), "EX", 24 * 60 * 60]]);
    return null;
  }
  const license = await getLicense(r.result);
  if (!license || license.status !== "active") return null;
  const previous = license.slpInstrument && license.slpInstrument !== instrumentId ? { customerId: license.slpCustomer ?? "", instrumentId: license.slpInstrument } : null;
  await attachCard(license, customerId, instrumentId);
  return { license, previous };
}

async function attachCard(license: License, customerId: string, instrumentId: string) {
  const changed = license.slpInstrument !== instrumentId;
  // 換了新卡：重試次數歸零、馬上可以再扣一次（寬限期內扣款失敗的人換卡後不用等）
  await setLicenseFields(
    license.id,
    { autoRenew: "1", renewVia: "shopline", slpCustomer: customerId, slpInstrument: instrumentId, ...(changed ? { chargeFails: 0 } : {}) },
    changed ? ["lastChargeAt"] : [],
  );
}

/** 新台幣訂閱入帳後：記下這個顧客編號對應的授權，把先到的綁卡結果（或這次通知帶的卡）接上去。 */
export async function linkShoplineCustomer(licenseId: string, customerRef: string, card?: { customerId: string; instrumentId: string }) {
  if (!customerRef) return;
  const [, pending] = await run([
    ["SET", `slpref:${customerRef}`, licenseId],
    ["GET", `slppending:${customerRef}`],
  ]);
  let found = card?.customerId && card.instrumentId ? card : null;
  if (!found && typeof pending.result === "string") {
    try {
      const parsed = JSON.parse(pending.result) as { customerId?: unknown; instrumentId?: unknown };
      if (typeof parsed.customerId === "string" && typeof parsed.instrumentId === "string") found = { customerId: parsed.customerId, instrumentId: parsed.instrumentId };
    } catch {
      // 壞掉的暫存就當沒有
    }
  }
  if (!found) return;
  const license = await getLicense(licenseId);
  if (license) await attachCard(license, found.customerId, found.instrumentId);
  await run([["DEL", `slppending:${customerRef}`]]);
}

/** 卡解除綁定後清掉授權上的卡（取消到期後由 cron 呼叫）。 */
export async function clearShoplineCard(licenseId: string) {
  await setLicenseFields(licenseId, {}, ["slpInstrument"]);
}
