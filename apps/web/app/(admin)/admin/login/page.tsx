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
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      {/* 很淡的紙張點格，往邊緣漸隱，只是質感 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--line)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-fg text-xs font-semibold text-bg">S</span>
          <span className="text-sm font-semibold">SunUI</span>
          <span className="rounded border border-line px-1 py-px text-[10px] font-medium text-subtle">管理後台</span>
        </div>

        <div className="rounded-xl border border-line bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
          <h1 className="text-lg font-semibold">登入後台</h1>
          <p className="mt-1 text-sm text-subtle">只有授權的帳號可以進入。</p>

          {error === "link" && (
            <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              登入連結無效或已過期。連結 15 分鐘內有效，而且要在送出申請的同一個瀏覽器開啟。
            </p>
          )}

          <div className="mt-6">
            <LoginForm googleClientId={clientId} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-subtle">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-fg">
            <Icon name="arrow" className="size-3.5 rotate-180" />
            回到 SunUI
          </Link>
          <span className="text-xs">登入狀態保留 7 天</span>
        </div>
      </div>
    </div>
  );
}
