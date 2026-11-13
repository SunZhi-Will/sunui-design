"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { adminToken } from "@/lib/admin";
import { ADMIN_COOKIE, createSession, SESSION_TTL_SECONDS, tokenMatches } from "@/lib/admin-session";
import { pipeline, sha256 } from "@/lib/redis";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 10;
const memoryAttempts = new Map<string, number[]>();

/** 同一個 IP 15 分鐘內最多試 10 次。Redis 可用時跨 instance 計算，否則用記憶體。 */
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

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const token = adminToken();
  if (!token) return { error: "後台尚未設定。" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await tooManyAttempts(ip)) return { error: "嘗試次數太多，請 15 分鐘後再試。" };

  const input = String(formData.get("token") ?? "");
  if (!(await tokenMatches(input, token))) return { error: "權杖不正確。" };

  (await cookies()).set(ADMIN_COOKIE, await createSession(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
