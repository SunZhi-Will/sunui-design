import { cookies } from "next/headers";

import { adminToken } from "@/lib/admin";
import {
  ADMIN_COOKIE,
  createSession,
  emailAllowed,
  LOGIN_NONCE_COOKIE,
  SESSION_TTL_SECONDS,
  verifyLoginLink,
} from "@/lib/admin-session";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// 登入信裡的連結。驗證簽章、到期時間、瀏覽器 nonce，以及 email 仍在白名單，通過才發 session。
export async function GET(request: Request) {
  const token = adminToken();
  const store = await cookies();
  const link = new URL(request.url).searchParams.get("t");
  const email = await verifyLoginLink(link, store.get(LOGIN_NONCE_COOKIE)?.value, token);

  if (!token || !email || !emailAllowed(email, process.env.SUNUI_ADMIN_EMAILS)) {
    return Response.redirect(`${siteUrl()}/admin/login?error=link`, 303);
  }

  const secure = process.env.NODE_ENV === "production";
  store.delete({ name: LOGIN_NONCE_COOKIE, path: "/admin" });
  store.set(ADMIN_COOKIE, await createSession(token), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
  return new Response(null, { status: 303, headers: { Location: `${siteUrl()}/admin` } });
}
