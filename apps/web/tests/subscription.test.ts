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
