"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PreviewPaywall } from "./preview-paywall";

const copy = {
  en: { slide: "Slide 3 / 24", heading: "Name the format" },
  "zh-TW": { slide: "第 3 張 / 共 24 張", heading: "說出這是哪種格式" },
  "zh-CN": { slide: "第 3 张 / 共 24 张", heading: "说出这是哪种格式" },
  ja: { slide: "スライド 3 / 24", heading: "フォーマットを答えよう" },
};

export default function PreviewPaywallDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="relative aspect-video w-full max-w-xl min-w-0 overflow-hidden rounded-xl border border-border bg-muted">
      {/* 試看到第三張，付費牆蓋在投影片上 */}
      <div className="flex h-full flex-col justify-between p-5 text-foreground">
        <p className="text-xs text-muted-foreground tabular-nums">{t.slide}</p>
        <p className="text-lg font-semibold sm:text-2xl">{t.heading}</p>
        <div className="h-1 w-full rounded-full bg-foreground/10" />
      </div>
      <PreviewPaywall locale={locale} previewCount={3} href="#" />
    </div>
  );
}
