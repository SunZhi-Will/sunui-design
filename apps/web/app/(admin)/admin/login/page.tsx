import { notFound, redirect } from "next/navigation";

import { adminToken, isAdmin } from "@/lib/admin";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!adminToken()) notFound();
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto mt-24 max-w-sm">
      <h1 className="text-xl font-semibold">SunUI Admin</h1>
      <p className="mt-1 text-sm text-subtle">輸入 SUNUI_ADMIN_TOKEN 登入。</p>
      <LoginForm />
    </div>
  );
}
