import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/messages";
import { siteUrl } from "@/lib/site";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { themeScript } from "@/registry/free/theme-picker/theme-script";

import "./globals.css";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    // 主題 class 由下面的內嵌腳本在第一次繪製前加上，伺服器端沒有，所以略過這一層的 hydration 比對
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(THEME_STORAGE_KEY) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>{children}</body>
    </html>
  );
}
