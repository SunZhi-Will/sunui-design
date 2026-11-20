// 訂閱方案（預付期間制）的期間計算與方案判斷。Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { addTerm, isPlan, isSubscription, planUsd, prices, pricesTwd } from "../lib/site.ts";

test("monthly and yearly are plans, unknown names are not", () => {
  for (const plan of ["founding", "pro", "team", "monthly", "yearly"]) assert.equal(isPlan(plan), true);
  for (const plan of ["", "lifetime", "toString", "__proto__"]) assert.equal(isPlan(plan), false);
});

test("only monthly and yearly are subscriptions", () => {
  assert.equal(isSubscription("monthly"), true);
  assert.equal(isSubscription("yearly"), true);
  assert.equal(isSubscription("pro"), false);
  assert.equal(isSubscription("founding"), false);
});

test("every plan has a USD and a TWD price", () => {
  for (const plan of Object.keys(pricesTwd) as (keyof typeof pricesTwd)[]) {
    assert.ok(planUsd(plan) > 0);
    assert.ok(pricesTwd[plan] > 0);
  }
  // 年訂要比 12 個月便宜，買斷要比一年貴，方案之間才有梯度
  assert.ok(prices.yearly < prices.monthly * 12);
  assert.ok(prices.pro > prices.yearly);
  assert.ok(pricesTwd.yearly < pricesTwd.monthly * 12);
});

test("addTerm adds one month or one year", () => {
  const from = new Date("2026-11-15T03:00:00Z");
  assert.equal(addTerm("monthly", from).toISOString(), "2026-12-15T03:00:00.000Z");
  assert.equal(addTerm("yearly", from).toISOString(), "2027-11-15T03:00:00.000Z");
  // 續兩期等於加兩個月；退款用 -1 扣回一期
  assert.equal(addTerm("monthly", from, 2).toISOString(), "2027-01-15T03:00:00.000Z");
  assert.equal(addTerm("monthly", addTerm("monthly", from), -1).toISOString(), from.toISOString());
  // 不改到傳進來的日期
  assert.equal(from.toISOString(), "2026-11-15T03:00:00.000Z");
});

// ---------- 自動續扣（2026-11-20 起）----------

import { chargeDue, GRACE_MS, licenseExpired, MAX_CHARGE_ATTEMPTS, renewalGaveUp, type RenewalState } from "../lib/subscription-core.ts";

const DAY = 24 * 60 * 60 * 1000;
const EXPIRES = "2026-12-20T03:00:00.000Z";
const at = (offsetMs: number) => new Date(new Date(EXPIRES).getTime() + offsetMs);
const shopline = (extra: Partial<RenewalState> = {}): RenewalState => ({
  status: "active",
  expiresAt: EXPIRES,
  autoRenew: true,
  renewVia: "shopline",
  slpCustomer: "cus_1",
  slpInstrument: "pi_1",
  ...extra,
});

test("auto-renewing licenses get a 7-day grace period, canceled and prepaid ones do not", () => {
  assert.equal(licenseExpired({ expiresAt: EXPIRES, autoRenew: true }, at(DAY)), false);
  assert.equal(licenseExpired({ expiresAt: EXPIRES, autoRenew: true }, at(GRACE_MS)), true);
  assert.equal(licenseExpired({ expiresAt: EXPIRES, autoRenew: false }, at(1)), true);
  assert.equal(licenseExpired({ expiresAt: EXPIRES }, at(1)), true);
  assert.equal(licenseExpired({}, at(1000 * DAY)), false);
});

test("SHOPLINE renewal is charged from 12 hours before expiry, only for active auto-renewing cards", () => {
  assert.equal(chargeDue(shopline(), at(-13 * 60 * 60 * 1000)), false);
  assert.equal(chargeDue(shopline(), at(-11 * 60 * 60 * 1000)), true);
  assert.equal(chargeDue(shopline({ autoRenew: false }), at(0)), false);
  assert.equal(chargeDue(shopline({ renewVia: "polar" }), at(0)), false);
  assert.equal(chargeDue(shopline({ slpInstrument: undefined }), at(0)), false);
  assert.equal(chargeDue(shopline({ status: "revoked" }), at(0)), false);
  assert.equal(chargeDue(shopline(), at(GRACE_MS)), false);
});

test("failed SHOPLINE charges retry on days 1, 3 and 5, then give up", () => {
  const failedAt = at(0).toISOString();
  assert.equal(chargeDue(shopline({ chargeFails: 1, lastChargeAt: failedAt }), at(12 * 60 * 60 * 1000)), false);
  assert.equal(chargeDue(shopline({ chargeFails: 1, lastChargeAt: failedAt }), at(DAY)), true);
  assert.equal(chargeDue(shopline({ chargeFails: 2, lastChargeAt: at(DAY).toISOString() }), at(2 * DAY)), false);
  assert.equal(chargeDue(shopline({ chargeFails: 2, lastChargeAt: at(DAY).toISOString() }), at(3 * DAY)), true);
  assert.equal(chargeDue(shopline({ chargeFails: MAX_CHARGE_ATTEMPTS, lastChargeAt: at(5 * DAY).toISOString() }), at(6 * DAY)), false);
  assert.equal(renewalGaveUp(shopline({ chargeFails: MAX_CHARGE_ATTEMPTS }), at(5 * DAY)), true);
  assert.equal(renewalGaveUp(shopline({ chargeFails: 1 }), at(2 * DAY)), false);
  assert.equal(renewalGaveUp(shopline({ chargeFails: 1 }), at(GRACE_MS)), true);
  // 已取消的不算放棄（它本來就會到期）
  assert.equal(renewalGaveUp(shopline({ autoRenew: false }), at(GRACE_MS)), false);
});
