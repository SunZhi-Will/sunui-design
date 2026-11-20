import { after } from "next/server";

import { notifyOwner, sendLicenseEmail, sendPaymentFailed } from "@/lib/mailer";
import {
  claimTrade,
  createOrder,
  endSubscription,
  expectedMinor,
  fulfillOrder,
  getOrder,
  licenseForPolarSubscription,
  linkPolarSubscription,
  logWebhook,
  markAmountMismatch,
  markPastDue,
  refundOrder,
  releaseTrade,
  setAutoRenew,
  syncSubscriptionPlan,
  type Order,
} from "@/lib/orders";
import { planForPolarProduct } from "@/lib/polar";
import { parsePolarEvent, verifyPolarSignature, type ParsedPolarEvent } from "@/lib/polar-core";
import { pipeline } from "@/lib/redis";
import { isSubscription, prices } from "@/lib/site";

export const dynamic = "force-dynamic";

// Polar 付款與訂閱通知（美金訂單）。Polar 後台 Settings → Webhooks 新增 <site>/api/polar/webhook，
// 格式選 Raw，勾 order.paid、order.refunded 與 subscription.active / canceled / uncanceled / past_due / revoked / updated，
// 拿到的 whsec_… 填進 POLAR_WEBHOOK_SECRET。
// 月訂、年訂是 Polar 的訂閱商品：第一期 order.paid（billing_reason = subscription_create）照一般訂單入帳並記下訂閱 id；
// 之後每一期 order.paid（subscription_cycle）沒有我們的訂單編號，用訂閱 id 找到授權，新建一筆續扣訂單後延長到期日。
// 回應碼：驗簽失敗 403；找不到訂單 404、儲存失敗 500，Polar 會重送（最多 10 次，連續失敗 10 次會停用這個 webhook）。
// 其他事件回 202，Polar 不會重送。

const accepted = (extra: Record<string, unknown> = {}) => Response.json({ ok: true, ...extra }, { status: 202 });

export async function POST(request: Request) {
  const signKey = process.env.POLAR_WEBHOOK_SECRET;
  const secret = process.env.SUNUI_ADMIN_TOKEN;
  if (!signKey || !secret) return Response.json({ error: "not_configured" }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 256 * 1024) return Response.json({ error: "too_large" }, { status: 413 });
  const valid = await verifyPolarSignature(
    raw,
    {
      id: request.headers.get("webhook-id") ?? "",
      timestamp: request.headers.get("webhook-timestamp") ?? "",
      signature: request.headers.get("webhook-signature") ?? "",
    },
    signKey,
  );
  if (!valid) {
    after(() => logWebhook({ type: "polar", order: null, result: "bad_signature" }));
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = parsePolarEvent(event);
  const type = `polar:${parsed.type}`;
  const record = (order: string | null, result: string) => after(() => logWebhook({ type, order, result }));

  try {
    if (parsed.type.startsWith("subscription.")) return await handleSubscriptionEvent(parsed, record);
    if (parsed.type !== "order.paid" && parsed.type !== "order.refunded") {
      record(null, "ignored");
      return accepted({ ignored: true });
    }

    // 續扣的那一期：沒有我們的訂單編號，用訂閱 id 找授權
    if (parsed.type === "order.paid" && parsed.billingReason === "subscription_cycle") {
      return await handleRenewal(parsed, secret, record);
    }

    // 先用 metadata 裡的訂單編號，沒有就用 checkout id，最後用 Polar order id（續扣訂單退款時）
    let order = parsed.orderId ? await getOrder(parsed.orderId) : null;
    if (!order && parsed.checkoutId) order = await orderByIndex(`ordersession:${parsed.checkoutId}`);
    if (!order && parsed.polarOrderId) order = await orderByIndex(`ordertrade:${parsed.polarOrderId}`);
    if (!order || order.provider !== "polar") {
      record(null, "order_not_found");
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    if (parsed.type === "order.refunded") {
      record(order.id, await refundOrder(order, parsed.refundedAmount));
      return accepted();
    }

    if (order.status === "paid" || order.status === "refunded") {
      // 重送的通知：訂閱 id 可能上一次還沒記到，補記一次（冪等）
      if (order.status === "paid" && parsed.subscriptionId && order.licenseId) {
        await linkPolarSubscription(order.licenseId, parsed.subscriptionId, parsed.customerId);
      }
      record(order.id, "duplicate");
      return accepted({ duplicate: true });
    }
    if (!parsed.paid || parsed.currency !== "usd" || parsed.netAmount !== expectedMinor(order)) {
      await markAmountMismatch(order, parsed.polarOrderId);
      record(order.id, "amount_mismatch");
      return accepted({ mismatch: true });
    }

    const issued = await fulfillOrder(order, parsed.polarOrderId, secret, { periodEnd: parsed.periodEnd });
    if (!issued) {
      record(order.id, "duplicate");
      return accepted({ duplicate: true });
    }
    if (isSubscription(order.plan) && parsed.subscriptionId) {
      await linkPolarSubscription(issued.licenseId, parsed.subscriptionId, parsed.customerId);
    }
    const paidOrder = order;
    after(async () => {
      await sendLicenseEmail(paidOrder, issued);
      await notifyOwner(paidOrder, issued);
    });
    record(order.id, "paid");
    return accepted();
  } catch {
    record(null, "store_failed");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

async function orderByIndex(key: string): Promise<Order | null> {
  const replies = await pipeline([["GET", key]]);
  const id = replies?.[0]?.result;
  return typeof id === "string" ? getOrder(id) : null;
}

type Recorder = (order: string | null, result: string) => void;

/** 續扣成功：新建一筆續扣訂單（帳務與退款才對得上），授權到期日延到 Polar 這一期的結束時間。 */
async function handleRenewal(parsed: ParsedPolarEvent, secret: string, record: Recorder) {
  const license = await licenseForPolarSubscription(parsed.subscriptionId);
  if (!license) {
    // 第一期的通知可能還在路上：回 404 讓 Polar 稍後重送
    record(null, "subscription_not_found");
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (!parsed.paid || !parsed.polarOrderId) {
    record(license.orderId, "ignored");
    return accepted({ ignored: true });
  }
  if (!(await claimTrade("polar", parsed.polarOrderId))) {
    record(license.orderId, "duplicate");
    return accepted({ duplicate: true });
  }

  try {
    const fromProduct = planForPolarProduct(parsed.productId);
    const plan = fromProduct && isSubscription(fromProduct) ? fromProduct : license.plan;
    if (!isSubscription(plan)) {
      record(license.orderId, "not_subscription");
      return accepted({ ignored: true });
    }
    const order = await createOrder(plan, license.email, { provider: "polar", recurring: true });
    if (parsed.currency !== "usd" || parsed.netAmount !== prices[plan] * 100) {
      await markAmountMismatch(order, parsed.polarOrderId);
      record(order.id, "amount_mismatch");
      return accepted({ mismatch: true });
    }
    const issued = await fulfillOrder(order, parsed.polarOrderId, secret, { periodEnd: parsed.periodEnd });
    if (!issued) {
      record(order.id, "duplicate");
      return accepted({ duplicate: true });
    }
    after(async () => {
      await sendLicenseEmail(order, issued);
      await notifyOwner(order, issued);
    });
    record(order.id, "renewed");
    return accepted();
  } catch (error) {
    // 沒入帳成功就放掉鎖，Polar 重送時可以再試
    await releaseTrade("polar", parsed.polarOrderId).catch(() => {});
    throw error;
  }
}

/** 訂閱狀態：取消（用到這期結束）、恢復、扣款失敗（寬限期）、真正結束。 */
async function handleSubscriptionEvent(parsed: ParsedPolarEvent, record: Recorder) {
  const license = await licenseForPolarSubscription(parsed.subscriptionId);
  if (!license) {
    // 第一期入帳時才記訂閱 id；在那之前的 subscription.created / active 不需要處理
    record(null, "subscription_not_found");
    return accepted({ ignored: true });
  }
  switch (parsed.type) {
    case "subscription.canceled":
      await setAutoRenew(license.id, false);
      record(license.orderId, "canceled");
      break;
    case "subscription.uncanceled":
      await setAutoRenew(license.id, true);
      record(license.orderId, "uncanceled");
      break;
    case "subscription.past_due": {
      const before = license.pastDueSince;
      const updated = await markPastDue(license.id);
      // 每次失敗 Polar 都可能再送一次，信只寄第一次
      if (!before && updated) after(() => sendPaymentFailed(updated).then(() => undefined));
      record(license.orderId, "past_due");
      break;
    }
    case "subscription.revoked":
      await endSubscription(license.id);
      record(license.orderId, "revoked");
      break;
    case "subscription.updated":
      await syncSubscriptionPlan(license.id, planForPolarProduct(parsed.productId));
      record(license.orderId, "updated");
      break;
    default:
      record(license.orderId, "ignored");
  }
  return accepted();
}
