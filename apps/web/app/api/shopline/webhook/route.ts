import { after } from "next/server";

import { notifyOwner, sendLicenseEmail } from "@/lib/mailer";
import { disputeOrder, findOrder, fulfillOrder, logWebhook, markAmountMismatch, refundOrder } from "@/lib/orders";
import { isForeignReference, parseWebhook, verifyShoplineSignature } from "@/lib/shopline-core";

export const dynamic = "force-dynamic";

// SHOPLINE Payments 付款通知。在 SHOPLINE 後台「設定 → 開發者管理 → Webhook 管理」新增
// <site>/api/shopline/webhook，勾選 trade.succeeded、trade.failed、trade.expired、trade.refund.succeeded 與 dispute.*，
// 這一列專屬的 Sign Key 填進 SHOPLINE_SIGN_KEY。
// 流程照作者 VideoAligner 的 webhook：別家產品的訂單回 200、找不到訂單回 404 讓對方重送、入帳冪等。
// 回應碼：驗簽失敗 401；儲存失敗 500（SHOPLINE 會照排程重送，最多 16 次）。

const ok = (extra: Record<string, unknown> = {}) => Response.json({ ok: true, ...extra });

export async function POST(request: Request) {
  const signKey = process.env.SHOPLINE_SIGN_KEY;
  const secret = process.env.SUNUI_ADMIN_TOKEN;
  if (!signKey || !secret) return Response.json({ error: "not_configured" }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 64 * 1024) return Response.json({ error: "too_large" }, { status: 413 });
  const valid = await verifyShoplineSignature(raw, request.headers.get("timestamp") ?? "", request.headers.get("sign") ?? "", signKey);
  if (!valid) {
    after(() => logWebhook({ type: "", order: null, result: "bad_signature" }));
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const { type, ids, paid, refunded, foreignProduct } = parseWebhook(event);
  const record = (order: string | null, result: string) => after(() => logWebhook({ type, order, result }));

  if (foreignProduct) {
    record(null, "foreign");
    return ok({ ignored: true });
  }

  try {
    if (type.startsWith("dispute.")) {
      const order = await findOrder(ids);
      // 拒付成立代表錢會被拿回去，授權先撤銷；其他爭議事件只記下來，到 SHOPLINE 後台回覆
      if (order && type === "dispute.chargeback.created") await disputeOrder(order);
      record(order?.id ?? null, "dispute");
      return ok();
    }

    if (type === "trade.refund.succeeded") {
      const order = await findOrder(ids);
      if (!order) {
        record(null, isForeignReference(ids) ? "foreign" : "order_not_found");
        return ok({ ignored: true });
      }
      record(order.id, await refundOrder(order, refunded));
      return ok();
    }

    // 其他事件（失敗、過期、取消）回 200 讓對方不要重送；買斷沒有續扣，不需要處理
    if (type !== "trade.succeeded") {
      record(null, "ignored");
      return ok({ ignored: true });
    }

    const order = await findOrder(ids);
    if (!order && isForeignReference(ids)) {
      record(null, "foreign");
      return ok({ ignored: true });
    }
    // 找不到訂單回 404：SHOPLINE 會重送，修好之後還收得到，不會掉單
    if (!order) {
      record(null, "order_not_found");
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    if (order.status === "paid" || order.status === "refunded") {
      record(order.id, "duplicate");
      return ok({ duplicate: true });
    }
    if (paid !== null && paid !== order.amountTwd * 100) {
      await markAmountMismatch(order, ids.tradeOrderId);
      record(order.id, "amount_mismatch");
      return ok({ mismatch: true });
    }

    const issued = await fulfillOrder(order, ids.tradeOrderId, secret);
    if (!issued) {
      record(order.id, "duplicate");
      return ok({ duplicate: true });
    }
    // 只有第一次入帳會走到這裡，重送的通知不會多寄
    after(async () => {
      await sendLicenseEmail(order, issued.key);
      await notifyOwner(order);
    });
    record(order.id, "paid");
    return ok();
  } catch {
    record(null, "store_failed");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
