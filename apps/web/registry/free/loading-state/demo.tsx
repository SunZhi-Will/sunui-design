"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { LoadingState } from "./loading-state";

const copy = {
  en: { heading: "Past bills", syncing: "Syncing", label: "Loading past bills" },
  "zh-TW": { heading: "過往帳單", syncing: "同步中", label: "正在載入過往帳單" },
  "zh-CN": { heading: "历史账单", syncing: "同步中", label: "正在加载历史账单" },
  ja: { heading: "過去の請求", syncing: "同期中", label: "過去の請求を読み込み中" },
};

export default function LoadingStateDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="ls-history" className="w-full max-w-md min-w-0 space-y-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 id="ls-history" className="text-sm font-semibold">
          {t.heading}
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">{t.syncing}</span>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <LoadingState rows={3} locale={locale} label={t.label} />
      </div>
    </section>
  );
}
