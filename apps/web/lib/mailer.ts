// 交易信：買家的授權碼信、給作者的新訂單通知。用 Resend，失敗不拋出（完成頁一樣看得到授權碼）。
// 寄件人 RESEND_FROM；沒驗證網域時預設 onboarding@resend.dev，那個地址只能寄給 Resend 帳號本人，
// 所以在 synvize.com 驗證完成前，買家收不到授權碼信，只有作者收得到通知。

import { orderAmountLabel, type Fulfilled, type License, type Order } from "./orders";
import { planUsd, prices, siteUrl } from "./site";

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
  const paid =
    order.provider === "polar" ? `Paid: ${orderAmountLabel(order)}.` : `Paid: ${orderAmountLabel(order)} (about US$${planUsd(order.plan)}).`;
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
      ...(issued.seatKeys
        ? [
            `Your Team license has ${issued.seatKeys.length} keys, one per developer. Give each person their own key; we can replace a single key later (for example when someone leaves) without touching the others.`,
            "",
            ...issued.seatKeys.map((k, i) => `Seat ${i + 1}: ${k}`),
            "",
            "Each developer sets up their own key:",
          ]
        : [`License key: ${key}`]),
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

/** 後台重發授權碼後，把新的那一把寄給買家（Team 寄給購買人，由他轉交給成員）。 */
export function sendReissuedKey(license: License, key: string) {
  const seat = license.seat ? ` (Team seat ${license.seat})` : "";
  return send(
    [license.email],
    `Your new SunUI license key${seat}`,
    [
      `We replaced a SunUI license key${seat} at your request. The old key (${license.display}) no longer works for new installs.`,
      "",
      `New key: ${key}`,
      "",
      "Update SUNUI_LICENSE_KEY in .env.local with the new key. Blocks already installed keep working.",
      "Reply to this email if you did not ask for this.",
    ].join("\n"),
  );
}

export function notifyOwner(order: Order, issued?: Fulfilled) {
  const owners = (process.env.SUNUI_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const kind = issued?.renewal ? "續約" : "新訂單";
  const until = issued?.expiresAt ? `\n到期 ${day(issued.expiresAt)}` : "";
  return send(
    owners,
    `${kind}：SunUI ${PLAN_NAME[order.plan]} ${orderAmountLabel(order)}`,
    `訂單 ${order.id}\n方案 ${PLAN_NAME[order.plan]}，${order.provider === "polar" ? "Polar 美金" : "SHOPLINE 新台幣"}${until}\n後台：${siteUrl()}/admin/orders`,
  );
}

/** 疑似分享：同一把授權碼一天內從超過 10 個 IP 安裝。只通知作者，由作者決定要不要在後台重發。 */
export function notifyOwnerSharing(license: License, ips: number) {
  const owners = (process.env.SUNUI_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const seat = license.seat ? `（Team 席位 ${license.seat}）` : "";
  return send(
    owners,
    `疑似分享：授權碼 ${license.display} 今天從 ${ips} 個 IP 安裝`,
    [
      `授權碼 ${license.display}${seat}，方案 ${PLAN_NAME[license.plan]}，訂單 ${license.orderId}。`,
      `今天從大約 ${ips} 個不同 IP 安裝 Pro block。超過 20 個會自動擋下。`,
      "",
      "換網路、出差、VPN 也會多幾個 IP，不一定是分享。如果確定外流，到後台「授權使用」按「重發」換掉這一把：",
      `${siteUrl()}/admin/licenses`,
    ].join("\n"),
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
