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
  });
  const empty = parsePolarEvent(null);
  assert.equal(empty.type, "");
  assert.equal(empty.netAmount, null);
});
