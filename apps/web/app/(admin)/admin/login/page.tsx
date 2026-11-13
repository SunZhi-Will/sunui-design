import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { adminToken, isAdmin } from "@/lib/admin";
import { googleClientId } from "@/lib/google-auth";

import { Icon } from "../icons";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登入" };

/**
 * 登入頁：置中單卡片（沿用作者 ComfyUI 後台的登入頁）。只有作者自己會看到，所以不放宣傳文案，
 * 一眼就是「選一種方式登入」。
 */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!adminToken()) notFound();
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const clientId = googleClientId();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      {/* 很淡的紙張點格，往邊緣漸隱，只是質感 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(var(--line)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_55%_at_center,black,transparent)]"
      />

      <div className="relative w-full max-w-[380px]">
        <div className="rounded-2xl border border-line bg-card px-7 pt-8 pb-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-fg text-base font-semibold text-bg">S</span>
            <h1 className="mt-5 text-xl font-semibold tracking-tight">登入 SunUI 後台</h1>
            <p className="mt-1.5 text-sm text-subtle">只有授權的帳號可以進入</p>
          </div>

          {error === "link" && (
            <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              登入連結無效或已過期。連結 15 分鐘內有效，而且要在送出申請的同一個瀏覽器開啟。
            </p>
          )}

          <div className="mt-7">
            <LoginForm googleClientId={clientId} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between px-1 text-xs text-subtle">
          <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-fg">
            <Icon name="arrow" className="size-3.5 rotate-180" />
            回到 SunUI
          </Link>
          <span>登入狀態保留 7 天</span>
        </div>
      </div>
    </div>
  );
}
