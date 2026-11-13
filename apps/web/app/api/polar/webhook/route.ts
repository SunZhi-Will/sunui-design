import { recordWebhook } from "@/lib/events";
import { restoreLicense, revokeLicense } from "@/lib/license";
import { verifyWebhook } from "@/lib/webhook-signature";

export const dynamic = "force-dynamic";

// Polar webhook。在 Polar 設定 → Webhooks 新增端點 <site>/api/polar/webhook，
// 勾選 benefit_grant.created / updated / revoked、order.paid、order.refunded，密鑰填進 POLAR_WEBHOOK_SECRET。
// 訂單本身不複製，Polar 是唯一的資料來源；這裡只處理授權撤銷與記錄最後收到時間。
type BenefitGrant = {
  is_granted?: boolean;
  is_revoked?: boolean;
  properties?: { license_key_id?: string };
};

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured." }, { status: 503 });

  const body = await request.text();
  const valid = await verifyWebhook(
    body,
    {
      id: request.headers.get("webhook-id"),
      timestamp: request.headers.get("webhook-timestamp"),
      signature: request.headers.get("webhook-signature"),
    },
    secret,
  );
  if (!valid) return Response.json({ error: "Invalid signature." }, { status: 403 });

  let event: { type?: string; data?: BenefitGrant };
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const type = event.type ?? "unknown";

  try {
    const licenseId = event.data?.properties?.license_key_id;
    if (type.startsWith("benefit_grant.") && licenseId) {
      if (type === "benefit_grant.revoked" || event.data?.is_revoked) await revokeLicense(licenseId);
      else if (event.data?.is_granted) await restoreLicense(licenseId);
    }
  } catch {
    // Redis 失敗回 500，讓 Polar 重送（最多 10 次）
    return Response.json({ error: "Could not store the event." }, { status: 500 });
  }

  await recordWebhook(type);
  return Response.json({ ok: true });
}
