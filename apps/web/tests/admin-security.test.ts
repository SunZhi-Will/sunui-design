// /admin 登入 cookie、email 登入連結、Google 登入。Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createLoginLink,
  createNonce,
  createSession,
  emailAllowed,
  LOGIN_LINK_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  verifyLoginLink,
  verifySession,
} from "../lib/admin-session.ts";
import { checkTokenInfo } from "../lib/google-auth.ts";

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

test("email allow list is case-insensitive and exact", () => {
  const list = " Owner@Example.com , second@example.org";
  assert.equal(emailAllowed("owner@example.com", list), true);
  assert.equal(emailAllowed("OWNER@EXAMPLE.COM ", list), true);
  assert.equal(emailAllowed("second@example.org", list), true);
  assert.equal(emailAllowed("owner@example.co", list), false);
  assert.equal(emailAllowed("", list), false);
  assert.equal(emailAllowed("owner@example.com", undefined), false);
});

test("login link works once per browser nonce and expires", async () => {
  const now = 1_800_000_000;
  const nonce = createNonce();
  const link = await createLoginLink("Owner@Example.com", nonce, TOKEN, now);
  assert.equal(await verifyLoginLink(link, nonce, TOKEN, now + 60), "owner@example.com");
  // 別的瀏覽器（沒有同一個 nonce）、別的 token、過期、竄改 email 都不行
  assert.equal(await verifyLoginLink(link, createNonce(), TOKEN, now + 60), null);
  assert.equal(await verifyLoginLink(link, undefined, TOKEN, now + 60), null);
  assert.equal(await verifyLoginLink(link, nonce, "another-token-entirely", now + 60), null);
  assert.equal(await verifyLoginLink(link, nonce, TOKEN, now + LOGIN_LINK_TTL_SECONDS + 1), null);
  const [, expires, sig] = link.split(".");
  const forged = `${btoa("attacker@example.com").replace(/=+$/, "")}.${expires}.${sig}`;
  assert.equal(await verifyLoginLink(forged, nonce, TOKEN, now + 60), null);
  // 登入連結的簽章不能拿來當 session cookie
  assert.equal(await verifySession(`${expires}.${sig}`, TOKEN, now + 60), false);
});

test("google tokeninfo must be ours, from Google, verified and fresh", () => {
  const client = "123-abc.apps.googleusercontent.com";
  const now = 1_800_000_000_000;
  const good = { aud: client, iss: "https://accounts.google.com", exp: now / 1000 + 600, email: "Owner@Example.com", email_verified: "true", name: "Owner", picture: "https://lh3.googleusercontent.com/a" };
  assert.deepEqual(checkTokenInfo(good, client, now), { email: "owner@example.com", name: "Owner", picture: "https://lh3.googleusercontent.com/a" });
  assert.equal(checkTokenInfo({ ...good, iss: "accounts.google.com" }, client, now)?.email, "owner@example.com");
  assert.equal(checkTokenInfo({ ...good, aud: "someone-else" }, client, now), null);
  assert.equal(checkTokenInfo({ ...good, iss: "https://evil.example" }, client, now), null);
  assert.equal(checkTokenInfo({ ...good, email_verified: "false" }, client, now), null);
  assert.equal(checkTokenInfo({ ...good, exp: now / 1000 - 1 }, client, now), null);
  assert.equal(checkTokenInfo({ ...good, email: undefined }, client, now), null);
  assert.equal(checkTokenInfo({ ...good, picture: "javascript:alert(1)" }, client, now)?.picture, "");
});
