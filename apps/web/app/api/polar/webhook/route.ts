import { after } from "next/server";

import { notifyOwner, sendLicenseEmail } from "@/lib/mailer";
import { expectedMinor, fulfillOrder, getOrder, logWebhook, markAmountMismatch, refundOrder } from "@/lib/orders";
import { parsePolarEvent, verifyPolarSignature } from "@/lib/polar-core";
import { pipeline } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Polar 付款通知（美金訂單）。Polar 後台 Settings → Webhooks 新增 <site>/api/polar/webhook，
// 格式選 Raw，勾 order.paid 與 order.refunded，拿到的 whsec_… 填進 POLAR_WEBHOOK_SECRET。
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

  if (parsed.type !== "order.paid" && parsed.type !== "order.refunded") {
    record(null, "ignored");
    return accepted({ ignored: true });
  }

  try {
    // 先用 metadata 裡的訂單編號，沒有就用 checkout id 找
    let order = parsed.orderId ? await getOrder(parsed.orderId) : null;
    if (!order && parsed.checkoutId) {
      const replies = await pipeline([["GET", `ordersession:${parsed.checkoutId}`]]);
      const id = replies?.[0]?.result;
      if (typeof id === "string") order = await getOrder(id);
    }
    if (!order || order.provider !== "polar") {
      record(null, "order_not_found");
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    if (parsed.type === "order.refunded") {
      record(order.id, await refundOrder(order, parsed.refundedAmount));
      return accepted();
    }

    if (order.status === "paid" || order.status === "refunded") {
      record(order.id, "duplicate");
      return accepted({ duplicate: true });
    }
    if (!parsed.paid || parsed.currency !== "usd" || parsed.netAmount !== expectedMinor(order)) {
      await markAmountMismatch(order, parsed.polarOrderId);
      record(order.id, "amount_mismatch");
      return accepted({ mismatch: true });
    }

    const issued = await fulfillOrder(order, parsed.polarOrderId, secret);
    if (!issued) {
      record(order.id, "duplicate");
      return accepted({ duplicate: true });
    }
    after(async () => {
      await sendLicenseEmail(order, issued);
      await notifyOwner(order, issued);
    });
    record(order.id, "paid");
    return accepted();
  } catch {
    record(null, "store_failed");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
