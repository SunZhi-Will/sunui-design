import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { siteUrl } from "@/lib/site";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { themeScript } from "@/registry/free/theme-picker/theme-script";

import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  // app/ 底下的 opengraph-image 也套到預覽頁，沒有 metadataBase 時建置會警告
  metadataBase: new URL(siteUrl()),
  title: "SunUI preview",
  robots: { index: false },
};

/**
 * 預覽 iframe 的 root layout：不讀 cookie 與 header，底下的預覽頁才能在建置時靜態產生、由 CDN 直接送出。
 * 語言由網址的 ?l= 帶入，DemoLocaleProvider 在瀏覽器端讀取並同步 <html lang>。
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(THEME_STORAGE_KEY) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>{children}</body>
    </html>
  );
}
