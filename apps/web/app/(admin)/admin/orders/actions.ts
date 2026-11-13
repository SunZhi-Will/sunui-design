"use server";

import { headers } from "next/headers";

import { isAdmin } from "@/lib/admin";
import { createOrder } from "@/lib/orders";
import { createCheckoutSession } from "@/lib/shopline";
import { shoplineConfigured } from "@/lib/site";

export type TestState = { url?: string; orderId?: string; amount?: number; error?: string };

/**
 * 後台「測試 SHOPLINE 連線」：用正式的金鑰建立一個 Pro 的結帳，確認 SHOPLINE 接受請求並回傳付款頁網址。
 * 只建立結帳，不付款就不會扣款（付款頁 60 分鐘後失效）。訂單標成測試，不算進統計。
 */
export async function testShopline(_prev: TestState): Promise<TestState> {
  if (!(await isAdmin())) return { error: "請先登入。" };
  if (!shoplineConfigured()) return { error: "SHOPLINE 金鑰還沒設定。" };
  const owner = (process.env.SUNUI_ADMIN_EMAILS ?? "").split(",")[0]?.trim() || "owner@example.com";
  try {
    const order = await createOrder("pro", owner, { test: true });
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const session = await createCheckoutSession(order, ip, "zh-TW");
    if (!session.ok) return { error: "SHOPLINE 拒絕了建立結帳的請求。檢查商家編號與 API key，詳細原因在 Vercel 的函式記錄（[shopline]）。", orderId: order.id };
    return { url: session.url, orderId: order.id, amount: order.amountTwd };
  } catch {
    return { error: "讀寫 Redis 失敗，確認 Upstash 已經接上。" };
  }
}
