"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ContentGate } from "./content-gate";

const copy = {
  en: { title: "Claude, Not Just Chat", subtitle: "Hands-on workshop", lessons: "12 lessons" },
  "zh-TW": { title: "Claude 不只是聊天", subtitle: "實作工作坊", lessons: "12 堂課" },
  "zh-CN": { title: "Claude 不只是聊天", subtitle: "实操工作坊", lessons: "12 节课" },
  ja: { title: "Claude はチャットだけじゃない", subtitle: "ハンズオンワークショップ", lessons: "全 12 回" },
};

export default function ContentGateDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-xl min-w-0 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10">
      {/* 課程頁頂部：已登入但這個帳號沒有購買 */}
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 text-sm dark:border-white/10">
        <span className="min-w-0 truncate font-semibold">{t.title}</span>
        <span className="shrink-0 text-xs opacity-60">{t.lessons}</span>
      </div>
      <ContentGate title={t.title} subtitle={t.subtitle} state="no-access" locale={locale} signInHref="#" contactHref="#" />
    </div>
  );
}
