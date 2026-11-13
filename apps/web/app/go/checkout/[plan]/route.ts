import { after } from "next/server";

import { isBot, recordFunnel } from "@/lib/events";
import { checkoutReady, foundingState, isPlan, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// 定價頁的結帳按鈕先經過這裡計數（/admin 漏斗的「點結帳」），再轉到 SunUI 的結帳頁。
// 伺服器端計數，不需要在頁面放追蹤腳本。
export async function GET(request: Request, { params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  const open = isPlan(plan) && checkoutReady() && (plan !== "founding" || foundingState() === "open");
  if (!open) return Response.redirect(`${siteUrl()}/pricing#waitlist`, 302);

  if (!isBot(request.headers.get("user-agent"))) after(() => recordFunnel(`checkout_click:${plan}`));
  return Response.redirect(`${siteUrl()}/checkout/${plan}`, 302);
}
