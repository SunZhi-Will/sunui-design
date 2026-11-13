// SHOPLINE 通知驗簽與解析、SunUI 授權碼。Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decryptLicenseKey,
  displayKey,
  encryptLicenseKey,
  generateLicenseKey,
  hashLicenseKey,
  LICENSE_KEY_PATTERN,
} from "../lib/license-key.ts";
import { isForeignReference, parseWebhook, signShopline, verifyShoplineSignature } from "../lib/shopline-core.ts";

const SIGN_KEY = "test-sign-key";
const body = JSON.stringify({ id: "evt_1", type: "trade.succeeded", data: { referenceOrderId: "SU0123456789abcdef012345" } });

test("shopline signature: hex and base64 accepted, tampering rejected", async () => {
  const ts = "1800000000000";
  const hexSig = await signShopline(body, ts, SIGN_KEY);
  assert.equal(await verifyShoplineSignature(body, ts, hexSig, SIGN_KEY), true);
  assert.equal(await verifyShoplineSignature(body, ts, hexSig.toUpperCase(), SIGN_KEY), true);
  const b64 = btoa(String.fromCharCode(...(hexSig.match(/../g) ?? []).map((h) => parseInt(h, 16))));
  assert.equal(await verifyShoplineSignature(body, ts, b64, SIGN_KEY), true);
  assert.equal(await verifyShoplineSignature(`${body} `, ts, hexSig, SIGN_KEY), false);
  assert.equal(await verifyShoplineSignature(body, "1800000000001", hexSig, SIGN_KEY), false);
  assert.equal(await verifyShoplineSignature(body, ts, hexSig, "other-key"), false);
  assert.equal(await verifyShoplineSignature(body, "abc", hexSig, SIGN_KEY), false);
  assert.equal(await verifyShoplineSignature(body, ts, hexSig, ""), false);
});

test("webhook parsing picks ids and amounts from either nesting", () => {
  const nested = parseWebhook({
    id: "e1",
    type: "trade.succeeded",
    data: { order: { sessionId: "s1", referenceOrderId: "SU0123456789abcdef012345", tradeOrderId: "t1", amount: { value: 409000 } } },
  });
  assert.deepEqual(nested.ids, { sessionId: "s1", referenceOrderId: "SU0123456789abcdef012345", tradeOrderId: "t1" });
  assert.equal(nested.paid, 409000);
  const flat = parseWebhook({ type: "trade.refund.succeeded", data: { tradeOrderId: "t2", refund: { amount: { value: "409000" } } } });
  assert.equal(flat.refunded, 409000);
  assert.equal(flat.ids.tradeOrderId, "t2");
  assert.equal(parseWebhook(null).type, "");
});

test("orders from other products on the same merchant are recognised", () => {
  assert.equal(parseWebhook({ data: { order: { products: [{ name: "Kinotrail Plus lifetime" }] } } }).foreignProduct, true);
  assert.equal(parseWebhook({ data: { order: { products: [{ name: "SunUI Pro" }] } } }).foreignProduct, false);
  assert.equal(parseWebhook({ data: {} }).foreignProduct, false);
  assert.equal(isForeignReference({ sessionId: "", referenceOrderId: "KT0123456789abcdef0123", tradeOrderId: "" }), true);
  assert.equal(isForeignReference({ sessionId: "", referenceOrderId: "SU0123456789abcdef012345", tradeOrderId: "" }), false);
  assert.equal(isForeignReference({ sessionId: "", referenceOrderId: "", tradeOrderId: "t" }), false);
});

test("license keys are well formed, unique, hashed and encrypted", async () => {
  const a = generateLicenseKey();
  const b = generateLicenseKey();
  assert.match(a, LICENSE_KEY_PATTERN);
  assert.notEqual(a, b);
  assert.equal(displayKey(a), `sunui_…${a.slice(-4)}`);
  assert.equal(await hashLicenseKey(a), await hashLicenseKey(` ${a} `));
  assert.notEqual(await hashLicenseKey(a), await hashLicenseKey(b));
  const sealed = await encryptLicenseKey(a, "secret-one-long-enough");
  assert.equal(await decryptLicenseKey(sealed, "secret-one-long-enough"), a);
  assert.equal(await decryptLicenseKey(sealed, "another-secret"), null);
  assert.equal(await decryptLicenseKey("junk", "secret-one-long-enough"), null);
});
