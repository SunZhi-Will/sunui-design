"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { LogoMenu, menuGlyphs } from "./logo-menu";

const copy = {
  en: { pages: "CardFlow pages", profile: "Profile card editor", grid: "Grid page", hello: "Hello, I'm Sun" },
  "zh-TW": { pages: "CardFlow 頁面", profile: "個人卡片編輯器", grid: "網格頁面", hello: "你好，我是 Sun" },
  "zh-CN": { pages: "CardFlow 页面", profile: "个人卡片编辑器", grid: "网格页面", hello: "你好，我是 Sun" },
  ja: { pages: "CardFlow のページ", profile: "プロフィールカード編集", grid: "グリッドページ", hello: "こんにちは、Sun です" },
};

export default function LogoMenuDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div
      className="relative h-64 w-full min-w-0 max-w-2xl overflow-hidden rounded-xl border border-border bg-background"
      style={{
        backgroundImage: "linear-gradient(color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <LogoMenu
        locale={locale}
        label={t.pages}
        items={[
          { label: t.profile, icon: menuGlyphs.profile, href: "#profile" },
          { label: t.grid, icon: menuGlyphs.grid, href: "#grid" },
        ]}
      />
      <div className="absolute left-24 top-8 right-4 min-w-0 max-w-[12rem] rounded-xl border border-border bg-card p-2.5 shadow-sm">
        <p className="truncate text-sm font-semibold text-foreground">{t.hello}</p>
      </div>
    </div>
  );
}
