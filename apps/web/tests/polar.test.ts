// Polar 通知驗簽與解析。Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePolarEvent, signPolar, verifyPolarSignature } from "../lib/polar-core.ts";

// Standard Webhooks 格式的測試金鑰（whsec_ + base64）
const SECRET = `whsec_${btoa("sunui-test-secret-0123456789")}`;
const NOW = 1_794_000_000;

test("accepts a valid Standard Webhooks signature", async () => {
  const body = JSON.stringify({ type: "order.paid", data: { id: "o1" } });
  const signature = await signPolar(body, "msg_1", String(NOW), SECRET);
  assert.equal(await verifyPolarSignature(body, { id: "msg_1", timestamp: String(NOW), signature }, SECRET, NOW), true);
  // 標頭裡有多組簽章時，任何一組對就通過
  assert.equal(
    await verifyPolarSignature(body, { id: "msg_1", timestamp: String(NOW), signature: `v1,bogus ${signature}` }, SECRET, NOW),
    true,
  );
});

test("accepts a legacy secret (UTF-8 bytes of the whole whsec_ string)", async () => {
  const legacy = "whsec_not-base64-legacy!";
  const body = "{}";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(legacy), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`m.${NOW}.${body}`));
  const sig = btoa(String.fromCharCode(...new Uint8Array(digest)));
  assert.equal(await verifyPolarSignature(body, { id: "m", timestamp: String(NOW), signature: `v1,${sig}` }, legacy, NOW), true);
});

test("rejects tampered bodies, wrong secrets, stale timestamps and missing headers", async () => {
  const body = '{"a":1}';
  const signature = await signPolar(body, "msg_2", String(NOW), SECRET);
  const headers = { id: "msg_2", timestamp: String(NOW), signature };
  assert.equal(await verifyPolarSignature('{"a":2}', headers, SECRET, NOW), false);
  assert.equal(await verifyPolarSignature(body, headers, `whsec_${btoa("other")}`, NOW), false);
  assert.equal(await verifyPolarSignature(body, headers, SECRET, NOW + 600), false);
  assert.equal(await verifyPolarSignature(body, { ...headers, signature: "" }, SECRET, NOW), false);
  assert.equal(await verifyPolarSignature(body, { ...headers, id: "" }, SECRET, NOW), false);
});

test("parses order events", () => {
  const parsed = parsePolarEvent({
    type: "order.paid",
    data: {
      id: "ord_1",
      paid: true,
      net_amount: 12900,
      refunded_amount: 0,
      currency: "USD",
      checkout_id: "chk_1",
      metadata: { sunui_order: "SU0123456789abcdef012345" },
    },
  });
  assert.deepEqual(parsed, {
    type: "order.paid",
    orderId: "SU0123456789abcdef012345",
    checkoutId: "chk_1",
    polarOrderId: "ord_1",
    paid: true,
    netAmount: 12900,
    refundedAmount: 0,
    currency: "usd",
    billingReason: "",
    subscriptionId: "",
    customerId: "",
    periodEnd: "",
    subscriptionStatus: "",
    cancelAtPeriodEnd: false,
    productId: "",
  });
  const empty = parsePolarEvent(null);
  assert.equal(empty.type, "");
  assert.equal(empty.netAmount, null);
});

test("parses subscription fields from renewal orders and subscription events", () => {
  const renewal = parsePolarEvent({
    type: "order.paid",
    data: {
      id: "ord_2",
      paid: true,
      net_amount: 1900,
      currency: "USD",
      billing_reason: "subscription_cycle",
      subscription_id: "sub_1",
      customer_id: "cus_1",
      product_id: "prod_monthly",
      subscription: { id: "sub_1", current_period_end: "2027-01-20T00:00:00Z", cancel_at_period_end: false },
      metadata: {},
    },
  });
  assert.equal(renewal.billingReason, "subscription_cycle");
  assert.equal(renewal.subscriptionId, "sub_1");
  assert.equal(renewal.customerId, "cus_1");
  assert.equal(renewal.periodEnd, "2027-01-20T00:00:00Z");
  assert.equal(renewal.productId, "prod_monthly");
  assert.equal(renewal.polarOrderId, "ord_2");
  assert.equal(renewal.orderId, "");

  const canceled = parsePolarEvent({
    type: "subscription.canceled",
    data: { id: "sub_1", status: "active", customer_id: "cus_1", cancel_at_period_end: true, current_period_end: "2027-01-20T00:00:00Z" },
  });
  assert.equal(canceled.subscriptionId, "sub_1");
  assert.equal(canceled.polarOrderId, "");
  assert.equal(canceled.cancelAtPeriodEnd, true);
  assert.equal(canceled.subscriptionStatus, "active");
});
