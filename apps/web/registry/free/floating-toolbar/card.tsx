"use client";

import { useState } from "react";

import { FloatingToolbar } from "./floating-toolbar";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 型錄卡片：畫布左側的浮動 AI 工具列，按 Generate 會轉圈後長出一張卡。 */
export default function FloatingToolbarCard() {
  const [tool, setTool] = useState<string | null>(null);
  const [cards, setCards] = useState(["Hello, I'm Sun"]);

  return (
    <div
      className="relative mx-auto h-56 w-72 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute inset-y-4 right-4 left-20 flex min-w-0 flex-col gap-2 overflow-hidden">
        {/* 只留最新四張，避免溢出畫布 */}
        {cards.map((title, i) => ({ title, i })).slice(-4).map(({ title, i }) => (
          <div key={i} className="w-full rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            {i > 0 && <p className="text-[10px] font-medium tracking-wide text-violet-500 uppercase">Generated</p>}
            <p className="truncate text-sm font-semibold text-gray-800">{title}</p>
          </div>
        ))}
      </div>

      <FloatingToolbar
        fixed={false}
        labels={{ toolbar: "AI tools", busy: "generating" }}
        selectedTool={tool}
        onSelectTool={setTool}
        onAction={async () => {
          await wait(1400);
          setCards((cs) => [...cs, "AI draft: a short bio"]);
        }}
      />
    </div>
  );
}
