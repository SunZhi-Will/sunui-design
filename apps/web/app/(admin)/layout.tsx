import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { formatDate, isAdmin } from "@/lib/admin";
import { licenseOverview } from "@/lib/admin-data";
import { RAIL_COOKIE } from "@/lib/admin-session";
import { webhookLast } from "@/lib/events";
import { redisEnabled } from "@/lib/redis";
import { foundingState, foundingWindow, salesOpen, shoplineConfigured } from "@/lib/site";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { themeScript } from "@/registry/free/theme-picker/theme-script";

import { logout } from "./admin/login/actions";
import { AdminSidebar, type SourceStatus } from "./admin/sidebar";

import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SunUI Admin", template: "%s | SunUI Admin" },
  robots: { index: false, follow: false },
};

function countdown(now = new Date()) {
  const state = foundingState(now);
  const days = (to: Date) => Math.max(0, Math.ceil((to.getTime() - now.getTime()) / 86_400_000));
  if (state === "upcoming") return `Founding 開賣 D-${days(foundingWindow.opensAt)}`;
  if (state === "open") return `Founding 截止 D-${days(foundingWindow.closesAt)}`;
  return "Founding 已截止";
}

async function sources(): Promise<SourceStatus[]> {
  const redis = redisEnabled();
  const last = redis ? await webhookLast().catch(() => null) : null;
  const latest = last ? Object.values(last).sort().at(-1) : undefined;
  return [
    { label: "Upstash Redis", ok: redis, detail: "安裝、Pro 使用、漏斗" },
    { label: "SHOPLINE", ok: shoplineConfigured(), detail: `${process.env.SHOPLINE_ENV === "live" ? "正式環境" : "測試環境"}，${salesOpen() ? "已開賣" : "未開賣"}` },
    {
      label: "付款通知",
      ok: Boolean(process.env.SHOPLINE_SIGN_KEY),
      detail: latest ? `最後收到 ${formatDate(latest)}` : "尚未收到事件",
    },
  ];
}

async function dormantCount() {
  const overview = await licenseOverview().catch(() => null);
  return overview?.ok ? overview.dormant.length : 0;
}

/** 作者自己看的後台，和網站分開一個 root layout：不讀語言 cookie、沒有網站導覽。只給作者看，文案只寫繁中。 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  const railCollapsed = (await cookies()).get(RAIL_COOKIE)?.value === "1";
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(THEME_STORAGE_KEY) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>
        {authed ? (
          <div className="lg:flex">
            <AdminSidebar
              sources={await sources()}
              countdown={countdown()}
              logout={logout}
              initialCollapsed={railCollapsed}
              badges={{ dormant: await dormantCount() }}
            />
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        ) : (
          // 未登入只會看到登入頁（自帶全版面版型）或 404
          children
        )}
      </body>
    </html>
  );
}
