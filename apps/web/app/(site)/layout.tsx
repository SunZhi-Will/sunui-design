import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FoundingBar } from "@/components/founding-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/messages";
import { siteUrl } from "@/lib/site";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { themeScript } from "@/registry/free/theme-picker/theme-script";

import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getLocale());
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: m.meta.siteTitle, template: "%s | SunUI" },
    description: m.meta.siteDescription,
    openGraph: { siteName: "SunUI", type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * 網站的 root layout。預覽 iframe（app/(preview)）有自己的 root layout：
 * 這裡讀 cookie 決定語言，會讓底下每一頁都變成動態，預覽頁要能靜態產生就不能共用這一層。
 */
export default async function SiteLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  const locale = await getLocale();
  return (
    // 主題 class 由下面的內嵌腳本在第一次繪製前加上，伺服器端沒有，所以略過這一層的 hydration 比對
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(THEME_STORAGE_KEY) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>
        <FoundingBar />
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">{children}</main>
        <SiteFooter />
        {/* 型錄卡片展開的面板（攔截路由 @modal/(.)blocks/[slug]） */}
        {modal}
      </body>
    </html>
  );
}
