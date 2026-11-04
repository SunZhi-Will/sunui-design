import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { siteUrl } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "SunUI: paper-feel commerce blocks for React",
    template: "%s | SunUI",
  },
  description:
    "Tear-off coupons, printed receipts, loyalty stamps and sale sections for React and Tailwind. Accessible, calm motion, installed with the shadcn CLI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>{children}</body>
    </html>
  );
}
