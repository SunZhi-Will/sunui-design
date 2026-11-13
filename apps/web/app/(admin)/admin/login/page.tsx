import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { adminToken, isAdmin } from "@/lib/admin";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登入" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!adminToken()) notFound();
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="mx-auto mt-24 max-w-sm">
      <span className="flex size-9 items-center justify-center rounded-lg bg-fg text-sm font-semibold text-bg">S</span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">登入 SunUI Admin</h1>
      <p className="mt-1 text-sm text-subtle">輸入 email，我們會寄一個登入連結給你。</p>
      {error === "link" && (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          登入連結無效或已過期。連結 15 分鐘內有效，而且要在送出申請的同一個瀏覽器開啟。
        </p>
      )}
      <LoginForm />
    </div>
  );
}
