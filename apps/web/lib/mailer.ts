// 交易信：買家的授權碼信、給作者的新訂單通知。用 Resend，失敗不拋出（完成頁一樣看得到授權碼）。
// 寄件人 RESEND_FROM；沒驗證網域時預設 onboarding@resend.dev，那個地址只能寄給 Resend 帳號本人，
// 所以在 synvize.com 驗證完成前，買家收不到授權碼信，只有作者收得到通知。

import type { Fulfilled, License, Order } from "./orders";
import { planUsd, prices, pricesTwd, siteUrl } from "./site";

const PLAN_NAME: Record<Order["plan"], string> = {
  founding: "Founding member",
  pro: "Pro",
  team: "Team (5 seats)",
  monthly: "Pro monthly",
  yearly: "Pro yearly",
};

const day = (iso: string) => iso.slice(0, 10);

async function send(to: string[], subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || to.length === 0) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? process.env.RESEND_ADMIN_FROM ?? "SunUI <onboarding@resend.dev>",
        // 買家按「回覆」時寄到這裡（synvize.com 的收信地址，由 Cloudflare Email Routing 轉到作者信箱）
        ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
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

export function sendLicenseEmail(order: Order, issued: Fulfilled) {
  const paid = `Paid: NT$${order.amountTwd.toLocaleString("en-US")} (about US$${planUsd(order.plan)}).`;
  if (issued.renewal) {
    return send(
      [order.email],
      `Your SunUI Pro subscription is renewed`,
      [
        `Thanks for renewing SunUI ${PLAN_NAME[order.plan]}.`,
        paid,
        "",
        `Your license now runs until ${day(issued.expiresAt ?? "")}. The key stays the same${issued.key ? `: ${issued.key}` : ""}, so there is nothing to change in your project.`,
        "",
        `Order ${order.id}. License terms: ${siteUrl()}/license`,
        "Reply to this email if you need help.",
      ].join("\n"),
    );
  }
  const key = issued.key ?? "";
  return send(
    [order.email],
    `Your SunUI ${PLAN_NAME[order.plan]} license`,
    [
      `Thanks for buying SunUI ${PLAN_NAME[order.plan]}.`,
      paid,
      ...(issued.expiresAt
        ? [`Your subscription runs until ${day(issued.expiresAt)}. It does not renew by itself: we email you a week before it ends, and buying again with this email extends the same key.`]
        : []),
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

export function notifyOwner(order: Order, issued?: Fulfilled) {
  const owners = (process.env.SUNUI_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const kind = issued?.renewal ? "續約" : "新訂單";
  const until = issued?.expiresAt ? `\n到期 ${day(issued.expiresAt)}` : "";
  return send(
    owners,
    `${kind}：SunUI ${PLAN_NAME[order.plan]} NT$${pricesTwd[order.plan].toLocaleString("en-US")}`,
    `訂單 ${order.id}\n方案 ${PLAN_NAME[order.plan]}（約 US$${planUsd(order.plan)}）${until}\n後台：${siteUrl()}/admin/orders`,
  );
}

/** 訂閱到期前的提醒信。續約就是用同一個 email 再買一期。 */
export function sendRenewalReminder(license: License) {
  const ends = day(license.expiresAt ?? "");
  return send(
    [license.email],
    `Your SunUI Pro subscription ends on ${ends}`,
    [
      `Your SunUI Pro subscription (${license.display}) ends on ${ends}. It does not renew by itself.`,
      "",
      "Blocks you already installed keep working after that. You just cannot install new Pro blocks or get updates.",
      "",
      `To keep going, buy another month (US$${prices.monthly}) or year (US$${prices.yearly}) with this same email. The key stays the same:`,
      `${siteUrl()}/pricing#subscribe`,
      "",
      `Or switch to lifetime Pro for US$${prices.pro} and never think about it again.`,
      "Reply to this email if you need help.",
    ].join("\n"),
  );
}
