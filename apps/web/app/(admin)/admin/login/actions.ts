"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { adminToken } from "@/lib/admin";
import {
  ADMIN_COOKIE,
  createLoginLink,
  createNonce,
  createSession,
  emailAllowed,
  LOGIN_LINK_TTL_SECONDS,
  LOGIN_NONCE_COOKIE,
  SESSION_TTL_SECONDS,
  tokenMatches,
} from "@/lib/admin-session";
import { pipeline, sha256 } from "@/lib/redis";
import { siteUrl } from "@/lib/site";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 10;
const memoryAttempts = new Map<string, number[]>();

/** 同一個 IP 15 分鐘內最多試 10 次（email 與權杖合計）。Redis 可用時跨 instance 計算，否則用記憶體。 */
async function tooManyAttempts(ip: string) {
  const now = Date.now();
  try {
    const key = `rl:admin:${(await sha256(`admin:${ip}`)).slice(0, 24)}:${Math.floor(now / 1000 / WINDOW_SECONDS)}`;
    const replies = await pipeline([["INCR", key], ["EXPIRE", key, WINDOW_SECONDS]]);
    if (replies) return Number(replies[0]?.result) > MAX_ATTEMPTS;
  } catch {
    // 退回記憶體版
  }
  const recent = (memoryAttempts.get(ip) ?? []).filter((t) => now - t < WINDOW_SECONDS * 1000);
  recent.push(now);
  memoryAttempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** session 與 nonce 都用 Lax：從信箱點連結是跨站導覽，Strict 的 cookie 不會被帶上。 */
const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/admin" };

export async function startSession() {
  const token = adminToken();
  if (!token) return;
  (await cookies()).set(ADMIN_COOKIE, await createSession(token), { ...cookieBase, maxAge: SESSION_TTL_SECONDS });
}

export type LoginState = { error?: string; sent?: boolean };

const SENT_MESSAGE: LoginState = { sent: true };

/** 寄登入連結。不論 email 在不在白名單都回一樣的訊息，不透露誰有權限。 */
export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const token = adminToken();
  if (!token) return { error: "後台尚未設定。" };
  if (await tooManyAttempts(await clientIp())) return { error: "嘗試次數太多，請 15 分鐘後再試。" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "請輸入正確的 email。" };
  if (!emailAllowed(email, process.env.SUNUI_ADMIN_EMAILS)) return SENT_MESSAGE;

  const nonce = createNonce();
  const link = `${siteUrl()}/admin/login/verify?t=${encodeURIComponent(await createLoginLink(email, nonce, token))}`;
  (await cookies()).set(LOGIN_NONCE_COOKIE, nonce, { ...cookieBase, maxAge: LOGIN_LINK_TTL_SECONDS });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      // 本機沒有 Resend 時把連結印在 dev server 的終端機
      console.log(`[admin] 登入連結（本機）：${link}`);
      return SENT_MESSAGE;
    }
    return { error: "寄信服務尚未設定（RESEND_API_KEY）。" };
  }

  const minutes = LOGIN_LINK_TTL_SECONDS / 60;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // 沒有驗證寄件網域時，Resend 只允許 onboarding@resend.dev 寄給帳號本人
      from: process.env.RESEND_ADMIN_FROM ?? "SunUI Admin <onboarding@resend.dev>",
      to: [email],
      subject: "SunUI Admin 登入連結",
      text: `點這個連結登入 SunUI Admin（${minutes} 分鐘內有效，只能在送出申請的同一個瀏覽器開啟）：\n\n${link}\n\n如果不是你申請的，忽略這封信即可。`,
      html: `<p>點下面的按鈕登入 SunUI Admin。連結 ${minutes} 分鐘內有效，只能在送出申請的同一個瀏覽器開啟。</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#0a0a0a;color:#fff;border-radius:6px;text-decoration:none">登入 SunUI Admin</a></p><p style="color:#6b6b6b;font-size:13px">如果不是你申請的，忽略這封信即可。</p>`,
    }),
  });
  if (!response.ok) {
    console.error(`[admin] Resend 回應 ${response.status}: ${(await response.text()).slice(0, 300)}`);
    return { error: "登入信寄送失敗，請稍後再試。" };
  }
  return SENT_MESSAGE;
}

/** 備用：直接輸入 SUNUI_ADMIN_TOKEN 登入（寄信服務故障時用）。 */
export async function loginWithToken(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const token = adminToken();
  if (!token) return { error: "後台尚未設定。" };
  if (await tooManyAttempts(await clientIp())) return { error: "嘗試次數太多，請 15 分鐘後再試。" };
  if (!(await tokenMatches(String(formData.get("token") ?? ""), token))) return { error: "權杖不正確。" };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
