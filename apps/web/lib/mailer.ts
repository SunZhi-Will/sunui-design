// 交易信：買家的授權碼信、給作者的新訂單通知。用 Resend，失敗不拋出（完成頁一樣看得到授權碼）。
// 寄件人 RESEND_FROM；沒驗證網域時預設 onboarding@resend.dev，那個地址只能寄給 Resend 帳號本人，
// 所以在 synvize.com 驗證完成前，買家收不到授權碼信，只有作者收得到通知。

import type { Order } from "./orders";
import { prices, pricesTwd, siteUrl } from "./site";

const PLAN_NAME: Record<Order["plan"], string> = { founding: "Founding member", pro: "Pro", team: "Team (5 seats)" };

async function send(to: string[], subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || to.length === 0) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? process.env.RESEND_ADMIN_FROM ?? "SunUI <onboarding@resend.dev>",
        to,
        subject,
        text,
      }),
    });
    if (!response.ok) console.error(`[mail] Resend ${response.status}`);
    return response.ok;
  } catch {
    return false;
  }
}

export function sendLicenseEmail(order: Order, key: string) {
  return send(
    [order.email],
    `Your SunUI ${PLAN_NAME[order.plan]} license`,
    [
      `Thanks for buying SunUI ${PLAN_NAME[order.plan]}.`,
      "",
      `License key: ${key}`,
      "",
      "1. Add it to .env.local:",
      `   SUNUI_LICENSE_KEY=${key}`,
      "2. Add the Pro registry to components.json:",
      `   "registries": { "@sunui-pro": { "url": "${siteUrl()}/r/pro/{name}.json", "headers": { "Authorization": "Bearer \${SUNUI_LICENSE_KEY}" } } }`,
      "3. Install a block:",
      "   npx shadcn@latest add @sunui-pro/coupon-claim-card",
      "",
      `Order ${order.id}. License terms: ${siteUrl()}/license`,
      "Keep this key private. Reply to this email if you need help.",
    ].join("\n"),
  );
}

export function notifyOwner(order: Order) {
  const owners = (process.env.SUNUI_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const usd = order.plan === "founding" ? prices.founding : prices[order.plan];
  return send(
    owners,
    `新訂單：SunUI ${PLAN_NAME[order.plan]} NT$${pricesTwd[order.plan].toLocaleString("en-US")}`,
    `訂單 ${order.id}\n方案 ${PLAN_NAME[order.plan]}（約 US$${usd}）\n後台：${siteUrl()}/admin/orders`,
  );
}
