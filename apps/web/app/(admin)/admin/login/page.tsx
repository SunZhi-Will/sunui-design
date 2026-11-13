import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { adminToken, isAdmin } from "@/lib/admin";
import { googleClientId } from "@/lib/google-auth";

import { Icon, type IconName } from "../icons";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登入" };

const HIGHLIGHTS: { icon: IconName; title: string; body: string }[] = [
  { icon: "dollar", title: "訂單與營收", body: "Founding 進度、退款率、方案組合，直接讀 Polar。" },
  { icon: "license", title: "授權有沒有被用", body: "誰買了沒裝、多久才第一次裝，Polar 看不到的這裡看得到。" },
  { icon: "funnel", title: "誰正要買", body: "沒帶授權碼就想裝 Pro 的次數，加上從定價頁到付款的漏斗。" },
];

/** 登入頁：分割畫面（沿用作者 usermeld 與 Vtuber 的登入頁）。左側品牌與重點只在桌機出現，右側是登入方式。 */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!adminToken()) notFound();
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const clientId = googleClientId();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-muted/40 p-12 lg:flex lg:flex-col lg:justify-between">
        {/* 紙張點格底紋，只是質感，不帶資訊 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--line)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <Brand className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">看見誰在用 SunUI，誰正準備付錢。</h2>
          <p className="mt-4 text-sm leading-relaxed text-subtle">
            把 Polar 的訂單、Pro 授權的實際使用、免費安裝與 AI 通路的需求放在同一頁，決定下一個 Pro scene 要做什麼。
          </p>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-card">
                  <Icon name={h.icon} />
                </span>
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="mt-0.5 text-sm text-subtle">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <PreviewCard />
        </div>

        <p className="relative text-xs text-subtle">內部工具。只有白名單裡的帳號能登入，客戶 email 只顯示部分。</p>
      </aside>

      <main className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Brand className="lg:invisible" />
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-subtle hover:text-fg">
            <Icon name="arrow" className="size-3.5 rotate-180" />
            回到 SunUI
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight">登入後台</h1>
          <p className="mt-1.5 mb-8 text-sm text-subtle">
            {clientId ? "用有權限的 Google 帳號登入，或收一封 email 登入連結。" : "輸入有權限的 email，我們會寄一個登入連結給你。"}
          </p>
          {error === "link" && (
            <p role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              登入連結無效或已過期。連結 15 分鐘內有效，而且要在送出申請的同一個瀏覽器開啟。
            </p>
          )}
          <LoginForm googleClientId={clientId} />
        </div>

        <p className="text-center text-xs text-subtle">登入狀態保留 7 天。</p>
      </main>
    </div>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-fg text-sm font-semibold text-bg">S</span>
      <span className="text-sm font-semibold">
        SunUI
        <span className="ml-1.5 rounded border border-line px-1 py-px text-[10px] font-medium text-subtle">Admin</span>
      </span>
    </div>
  );
}

/** 後台畫面的抽象縮圖：只有形狀，不放數字，避免看起來像真實資料。 */
function PreviewCard() {
  const bars = [38, 52, 44, 61, 48, 70, 58, 76, 66, 84, 72, 90];
  return (
    <div aria-hidden="true" className="mt-12 rounded-xl border border-line bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line [&>*]:bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 p-3">
            <div className="h-1.5 w-10 rounded-full bg-muted" />
            <div className="h-3 w-14 rounded-full bg-fg/80" />
            <div className="h-1 w-full rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-16 items-end gap-1">
        {bars.map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-[2px] ${i === bars.length - 1 ? "bg-fg/80" : "bg-fg/15"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
