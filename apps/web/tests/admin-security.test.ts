// /admin 登入 cookie 與 Polar webhook 簽章驗證。Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, SESSION_TTL_SECONDS, tokenMatches, verifySession } from "../lib/admin-session.ts";
import { signWebhook, verifyWebhook } from "../lib/webhook-signature.ts";

const TOKEN = "a-long-enough-admin-token";

test("admin session verifies with the same token and expires", async () => {
  const now = 1_800_000_000;
  const cookie = await createSession(TOKEN, now);
  assert.equal(await verifySession(cookie, TOKEN, now + 60), true);
  assert.equal(await verifySession(cookie, "another-token-entirely", now + 60), false);
  assert.equal(await verifySession(cookie, TOKEN, now + SESSION_TTL_SECONDS + 1), false);
});

test("admin session rejects tampering and junk", async () => {
  const now = 1_800_000_000;
  const [expires, sig] = (await createSession(TOKEN, now)).split(".");
  assert.equal(await verifySession(`${Number(expires) + 9999}.${sig}`, TOKEN, now), false);
  assert.equal(await verifySession("", TOKEN, now), false);
  assert.equal(await verifySession("abc.def", TOKEN, now), false);
  assert.equal(await verifySession(undefined, TOKEN, now), false);
  assert.equal(await verifySession(`${expires}.${sig}`, undefined, now), false);
});

test("token comparison", async () => {
  assert.equal(await tokenMatches(TOKEN, TOKEN), true);
  assert.equal(await tokenMatches(`${TOKEN}x`, TOKEN), false);
  assert.equal(await tokenMatches("", TOKEN), false);
});

const body = JSON.stringify({ type: "benefit_grant.revoked", data: { properties: { license_key_id: "lk_1" } } });
const now = 1_800_000_000;
const ts = String(now);

test("webhook accepts the legacy Polar secret (UTF-8 bytes of whsec_…)", async () => {
  const secret = "whsec_legacy-polar-secret";
  const signature = await signWebhook(body, "msg_1", ts, new TextEncoder().encode(secret));
  assert.equal(await verifyWebhook(body, { id: "msg_1", timestamp: ts, signature }, secret, now), true);
});

test("webhook accepts a Standard Webhooks secret (base64 after whsec_)", async () => {
  const raw = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const secret = `whsec_${btoa(String.fromCharCode(...raw))}`;
  const signature = await signWebhook(body, "msg_2", ts, raw);
  // 標頭可以帶多個簽章，任一符合即可
  const header = `v1,bm90LWEtcmVhbC1zaWc= ${signature}`;
  assert.equal(await verifyWebhook(body, { id: "msg_2", timestamp: ts, signature: header }, secret, now), true);
});

test("webhook rejects a changed body, wrong secret, old timestamp or missing headers", async () => {
  const secret = "whsec_legacy-polar-secret";
  const signature = await signWebhook(body, "msg_3", ts, new TextEncoder().encode(secret));
  const headers = { id: "msg_3", timestamp: ts, signature };
  assert.equal(await verifyWebhook(`${body} `, headers, secret, now), false);
  assert.equal(await verifyWebhook(body, headers, "whsec_other", now), false);
  assert.equal(await verifyWebhook(body, headers, secret, now + 10 * 60), false);
  assert.equal(await verifyWebhook(body, { ...headers, id: null }, secret, now), false);
  assert.equal(await verifyWebhook(body, { ...headers, signature: "v2,abc" }, secret, now), false);
});
