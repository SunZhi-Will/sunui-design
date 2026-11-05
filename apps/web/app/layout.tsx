import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/messages";
import { siteUrl } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getLocale());
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: m.meta.siteTitle, template: "%s | SunUI" },
    description: m.meta.siteDescription,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>{children}</body>
    </html>
  );
}
