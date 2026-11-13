import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ADMIN_COOKIE, verifySession } from "./admin-session";

/** 沒設定 SUNUI_ADMIN_TOKEN 時整個 /admin 都不存在（404）。 */
export function adminToken() {
  const token = process.env.SUNUI_ADMIN_TOKEN?.trim();
  return token && token.length >= 16 ? token : undefined;
}

export async function isAdmin() {
  const token = adminToken();
  if (!token) return false;
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value, token);
}

/** 每個 admin 頁面開頭呼叫。未登入回 404，不透露後台存在。 */
export async function requireAdmin() {
  if (!(await isAdmin())) notFound();
}

/** 只顯示 email 的第一個字與網域，避免截圖外流。 */
export function maskEmail(email: string | null | undefined) {
  if (!email) return "(無 email)";
  const [user, domain] = email.split("@");
  return domain ? `${user.slice(0, 1)}***@${domain}` : "***";
}

export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export function formatDate(iso: string | undefined | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(iso));
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000));
}
