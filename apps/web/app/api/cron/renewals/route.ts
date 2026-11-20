import {
  notifyOwner,
  sendLicenseEmail,
  sendPaymentFailed,
  sendRenewalReminder,
  sendSubscriptionEnded,
  sendSubscriptionEnding,
  sendUpcomingCharge,
} from "@/lib/mailer";
import {
  chargeDue,
  clearShoplineCard,
  createOrder,
  endSubscription,
  fulfillOrder,
  licenseExpired,
  licensesToRemind,
  listLicenses,
  lockCharge,
  markOrderFailed,
  markReminded,
  recordChargeAttempt,
  renewalGaveUp,
  type License,
} from "@/lib/orders";
import { chargeRecurring, unbindCard } from "@/lib/shopline";
import { isSubscription } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 訂閱排程：每天跑一次（vercel.json 的 crons）。Vercel Cron 會帶 Authorization: Bearer ${CRON_SECRET}；沒設定 CRON_SECRET 時拒絕執行。
// 1. 新台幣（SHOPLINE）續扣：SHOPLINE 只提供「用存的卡扣一次」，排程與重試在這裡做。到期前 12 小時內扣款，
//    失敗後在到期後第 1、3、5 天重試（lib/orders.ts 的 RETRY_GAPS_MS），都在 7 天寬限期內。重試用完就結束訂閱、解除綁卡。
//    美金（Polar）的扣款與重試由 Polar 自己做，這裡不碰。
// 2. 已取消的新台幣訂閱過期後解除綁卡。
// 3. 到期前 7 天的信：自動續扣中寄「將於某日扣款」，已取消寄「將於某日結束」，舊的預付制授權寄續訂提醒。

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const adminSecret = process.env.SUNUI_ADMIN_TOKEN;
  if (!adminSecret) return Response.json({ error: "not_configured" }, { status: 503 });

  const now = new Date();
  let all: License[];
  try {
    all = (await listLicenses(5000)).filter((l) => l.expiresAt && l.status === "active");
  } catch {
    return Response.json({ error: "store_failed" }, { status: 500 });
  }

  const result = { charged: 0, failed: 0, processing: 0, ended: 0, unbound: 0, notices: 0 };

  for (const license of all) {
    try {
      if (license.renewVia === "shopline") {
        // 重試用完或寬限期過了：結束訂閱、解除綁卡
        if (renewalGaveUp(license, now)) {
          await endSubscription(license.id, now);
          if (license.slpCustomer && license.slpInstrument) {
            await unbindCard(license.slpCustomer, license.slpInstrument);
            await clearShoplineCard(license.id);
          }
          await sendSubscriptionEnded(license);
          result.ended += 1;
          continue;
        }
        // 已取消而且過期了：卡不需要再留
        if (license.autoRenew === false && license.slpInstrument && licenseExpired(license, now)) {
          await unbindCard(license.slpCustomer ?? "", license.slpInstrument);
          await clearShoplineCard(license.id);
          result.unbound += 1;
          continue;
        }
        if (chargeDue(license, now)) {
          const outcome = await chargeShopline(license, adminSecret);
          result[outcome] += 1;
        }
      }
    } catch (error) {
      console.error(`[cron] renewal ${license.id}`, error);
    }
  }

  // 到期前 7 天的信（續扣過的授權到期日已經往後延，不會落在窗口內）
  let due: License[] = [];
  try {
    due = await licensesToRemind(WINDOW_MS, now);
  } catch {
    // 寄信失敗不影響扣款結果
  }
  for (const license of due) {
    const send = license.autoRenew === true ? sendUpcomingCharge : license.autoRenew === false ? sendSubscriptionEnding : sendRenewalReminder;
    // 寄信失敗就不標記，明天再試
    if (await send(license)) {
      await markReminded(license).catch(() => {});
      result.notices += 1;
    }
  }

  return Response.json({ ok: true, ...result });
}

/** 扣一期：建一筆續扣訂單，用存的卡扣款。成功就延長授權；失敗記一次、第一次失敗寄信請客戶換卡。 */
async function chargeShopline(license: License, secret: string): Promise<"charged" | "failed" | "processing"> {
  if (!isSubscription(license.plan) || !(await lockCharge(license))) return "processing";
  const order = await createOrder(license.plan, license.email, { provider: "shopline", recurring: true });
  const outcome = await chargeRecurring(order, license.plan, { customerId: license.slpCustomer ?? "", instrumentId: license.slpInstrument ?? "" });

  if (outcome.outcome === "succeeded") {
    const issued = await fulfillOrder(order, outcome.tradeOrderId, secret);
    if (issued) {
      await sendLicenseEmail(order, issued);
      await notifyOwner(order, issued);
    }
    return "charged";
  }
  if (outcome.outcome === "processing") {
    // 結果由付款通知決定（trade.succeeded 入帳、trade.failed 記失敗）；先記下這次嘗試，排程不會馬上重扣
    await recordChargeAttempt(license.id, false);
    return "processing";
  }
  await markOrderFailed(order, outcome.tradeOrderId);
  const firstFailure = !license.pastDueSince;
  const updated = await recordChargeAttempt(license.id, true);
  if (firstFailure && updated) await sendPaymentFailed(updated);
  return "failed";
}
