"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FloatingToolbar } from "./floating-toolbar";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const copy = {
  en: { toolbar: "AI tools", busy: "generating", generated: "Generated", first: "Hello, I'm Sun", draft: "AI draft: a short bio" },
  "zh-TW": { toolbar: "AI 工具", busy: "生成中", generated: "已生成", first: "你好，我是 Sun", draft: "AI 草稿：簡短自介" },
  "zh-CN": { toolbar: "AI 工具", busy: "生成中", generated: "已生成", first: "你好，我是 Sun", draft: "AI 草稿：简短自我介绍" },
  ja: { toolbar: "AI ツール", busy: "生成中", generated: "生成済み", first: "こんにちは、Sun です", draft: "AI 下書き：短い自己紹介" },
};

/** 型錄卡片：畫布左側的浮動 AI 工具列，按 Generate 會轉圈後長出一張卡。 */
export default function FloatingToolbarCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [tool, setTool] = useState<string | null>(null);
  // 存索引，語言切換時文字跟著換
  const [cards, setCards] = useState(1);
  const titles = Array.from({ length: cards }, (_, i) => (i === 0 ? t.first : t.draft));

  return (
    <div
      className="relative mx-auto h-56 w-72 overflow-hidden rounded-xl border border-border bg-background"
      style={{
        backgroundImage: "linear-gradient(color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute inset-y-4 right-4 left-20 flex min-w-0 flex-col gap-2 overflow-hidden">
        {/* 只留最新四張，避免溢出畫布 */}
        {titles.map((title, i) => ({ title, i })).slice(-4).map(({ title, i }) => (
          <div key={i} className="w-full rounded-xl border border-border bg-card p-2.5 shadow-sm">
            {i > 0 && <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{t.generated}</p>}
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          </div>
        ))}
      </div>

      <FloatingToolbar
        fixed={false}
        locale={locale}
        labels={{ toolbar: t.toolbar, busy: t.busy }}
        selectedTool={tool}
        onSelectTool={setTool}
        onAction={async () => {
          await wait(1400);
          setCards((n) => n + 1);
        }}
      />
    </div>
  );
}
