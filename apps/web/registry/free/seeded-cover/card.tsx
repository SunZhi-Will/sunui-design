"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SeededCover, storyThemes } from "./seeded-cover";

const copy = {
  en: { label: "Title", title: "Ferry Night Watch" },
  "zh-TW": { label: "書名", title: "渡口守夜：燈下之約" },
  "zh-CN": { label: "书名", title: "渡口守夜：灯下之约" },
  ja: { label: "書名", title: "渡し場の夜番：灯の下の約束" },
};

/** 型錄卡片：輸入書名，封面的色相、紋理與直排字就由書名決定，同名永遠同一張。 */
export default function SeededCoverCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [title, setTitle] = useState(t.title);

  // 切換語言時換成該語言的範例書名
  useEffect(() => setTitle(t.title), [t.title]);

  return (
    <div
      className="mx-auto flex w-72 items-center gap-4 rounded-[8px] border p-3"
      style={{ ...(storyThemes.ink as CSSProperties), background: "var(--story-bg)", color: "var(--story-text)", borderColor: "var(--story-line)" }}
    >
      <SeededCover seed={title} title={title} locale={locale} className="w-[120px]" />
      <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs" style={{ color: "var(--story-muted)" }}>
        {t.label}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-[6px] border bg-transparent px-2 py-1.5 font-serif text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ borderColor: "var(--story-line)", color: "var(--story-text)" }}
        />
      </label>
    </div>
  );
}
