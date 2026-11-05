"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StatusBadge } from "./work-badge";

const copy = {
  en: { kicker: "Reading tool, 2026", help: "Open to everyone, features may still change" },
  "zh-TW": { kicker: "閱讀工具，2026", help: "開放所有人使用，功能仍可能調整" },
  "zh-CN": { kicker: "阅读工具，2026", help: "向所有人开放，功能仍可能调整" },
  ja: { kicker: "読書ツール、2026", help: "どなたでも利用できます。機能は今後変わる可能性があります" },
};

export default function WorkBadgeDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <article className="w-full max-w-md rounded-xl border border-[rgba(212,175,55,0.14)] bg-[#08080a] p-5 text-[#f7f5f0]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[#a8a296]">{t.kicker}</p>
          <h3 className="truncate text-lg font-medium">Lumen Reader</h3>
        </div>
        <StatusBadge status="public-beta" locale={locale} help={t.help} />
      </header>
    </article>
  );
}
