import { sendRenewalReminder } from "@/lib/mailer";
import { licensesToRemind, markReminded } from "@/lib/orders";

export const dynamic = "force-dynamic";

// 訂閱到期提醒：每天跑一次（vercel.json 的 crons），找 7 天內到期、這個到期日還沒提醒過的訂閱授權，寄一封信。
// Vercel Cron 會帶 Authorization: Bearer ${CRON_SECRET}；沒設定 CRON_SECRET 時拒絕執行。
// 訂閱不綁卡、不自動扣款，這封信就是續約的入口。

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let due;
  try {
    due = await licensesToRemind(WINDOW_MS);
  } catch {
    return Response.json({ error: "store_failed" }, { status: 500 });
  }

  let sent = 0;
  for (const license of due) {
    // 寄信失敗就不標記，明天再試
    if (await sendRenewalReminder(license)) {
      await markReminded(license).catch(() => {});
      sent += 1;
    }
  }
  return Response.json({ ok: true, due: due.length, sent });
}
