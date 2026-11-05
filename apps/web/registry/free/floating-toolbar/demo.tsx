"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FloatingToolbar } from "./floating-toolbar";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const copy = {
  en: {
    toolbar: "AI tools", busy: "generating", generated: "Generated", first: "Hello, I'm Sun", draft: "AI draft: a short bio",
    hints: {
      enhance: "Enhance: pick a card to polish its copy.",
      analyze: "Analyze: pick a card to summarise it.",
      transform: "Transform: pick a card to turn it into another type.",
    } as Record<string, string>,
    idle: "Generate adds a card.",
  },
  "zh-TW": {
    toolbar: "AI 工具", busy: "生成中", generated: "已生成", first: "你好，我是 Sun", draft: "AI 草稿：簡短自介",
    hints: {
      enhance: "優化：選一張卡片潤飾文案。",
      analyze: "分析：選一張卡片產生摘要。",
      transform: "轉換：選一張卡片轉成其他類型。",
    } as Record<string, string>,
    idle: "按「生成內容」會新增一張卡片。",
  },
  "zh-CN": {
    toolbar: "AI 工具", busy: "生成中", generated: "已生成", first: "你好，我是 Sun", draft: "AI 草稿：简短自我介绍",
    hints: {
      enhance: "优化：选一张卡片润色文案。",
      analyze: "分析：选一张卡片生成摘要。",
      transform: "转换：选一张卡片转成其他类型。",
    } as Record<string, string>,
    idle: "点「生成内容」会新增一张卡片。",
  },
  ja: {
    toolbar: "AI ツール", busy: "生成中", generated: "生成済み", first: "こんにちは、Sun です", draft: "AI 下書き：短い自己紹介",
    hints: {
      enhance: "改善：カードを選ぶと文章を整えます。",
      analyze: "分析：カードを選ぶと要約します。",
      transform: "変換：カードを選ぶと別のタイプに変えます。",
    } as Record<string, string>,
    idle: "「生成」でカードが 1 枚増えます。",
  },
};

export default function FloatingToolbarDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [tool, setTool] = useState<string | null>(null);
  // 存索引，語言切換時文字跟著換
  const [cards, setCards] = useState(1);
  const titles = Array.from({ length: cards }, (_, i) => (i === 0 ? t.first : t.draft));

  return (
    <div
      className="relative h-[24rem] w-full min-w-0 max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute inset-y-6 left-20 right-4 flex min-w-0 flex-col gap-2 overflow-hidden">
        {titles.map((title, i) => (
          <div key={i} className="w-full max-w-[12rem] rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            {i > 0 && <p className="text-[10px] font-medium uppercase tracking-wide text-violet-500">{t.generated}</p>}
            <p className="truncate text-sm font-semibold text-gray-800">{title}</p>
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
          // 這裡換成真正的 AI 呼叫
          await wait(1400);
          setCards((n) => n + 1);
        }}
      />

      <p aria-live="polite" className="absolute bottom-3 left-20 right-3 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-xs text-gray-600 backdrop-blur-xl">
        {tool ? t.hints[tool] : t.idle}
      </p>
    </div>
  );
}
