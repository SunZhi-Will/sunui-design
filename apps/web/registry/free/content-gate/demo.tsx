"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ContentGate, PaywallOverlay } from "./content-gate";

const copy = {
  en: { title: "Claude, Not Just Chat", subtitle: "Hands-on workshop", lessons: "12 lessons", slide: "Slide 3 / 24", heading: "Name the format" },
  "zh-TW": { title: "Claude 不只是聊天", subtitle: "實作工作坊", lessons: "12 堂課", slide: "第 3 張 / 共 24 張", heading: "說出這是哪種格式" },
  "zh-CN": { title: "Claude 不只是聊天", subtitle: "实操工作坊", lessons: "12 节课", slide: "第 3 张 / 共 24 张", heading: "说出这是哪种格式" },
  ja: { title: "Claude はチャットだけじゃない", subtitle: "ハンズオンワークショップ", lessons: "全 12 回", slide: "スライド 3 / 24", heading: "フォーマットを答えよう" },
};

export default function ContentGateDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-4 md:grid-cols-2">
      {/* 頁內版：課程頁頂部，已登入但這個帳號沒有購買 */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/10">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 text-sm dark:border-white/10">
          <span className="min-w-0 truncate font-semibold">{t.title}</span>
          <span className="shrink-0 text-xs opacity-60">{t.lessons}</span>
        </div>
        <ContentGate title={t.title} subtitle={t.subtitle} state="no-access" locale={locale} signInHref="#" contactHref="#" />
      </div>

      {/* 覆蓋版：試看到第三張，付費牆蓋在投影片播放器上 */}
      <div className="relative min-h-80 w-full min-w-0 overflow-hidden rounded-xl border border-border bg-muted">
        <div className="absolute inset-0 flex flex-col justify-between p-5 text-foreground">
          <div>
            <p className="text-xs text-muted-foreground tabular-nums">{t.slide}</p>
            <p className="mt-3 text-2xl font-semibold">{t.heading}</p>
          </div>
          <div className="h-1 w-full rounded-full bg-foreground/10">
            <div className="h-full w-[12.5%] rounded-full bg-foreground/40" />
          </div>
        </div>
        <PaywallOverlay locale={locale} previewCount={3} href="#" />
      </div>
    </div>
  );
}
