"use client";

import { useState } from "react";

import { FloatingToolbar } from "./floating-toolbar";

const hints: Record<string, string> = {
  enhance: "Enhance: pick a card to polish its copy.",
  analyze: "Analyze: pick a card to summarise it.",
  transform: "Transform: pick a card to turn it into another type.",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FloatingToolbarDemo() {
  const [tool, setTool] = useState<string | null>(null);
  const [cards, setCards] = useState(["Hello, I'm Sun"]);

  return (
    <div
      className="relative h-[24rem] w-full min-w-0 max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute inset-y-6 left-20 right-4 flex min-w-0 flex-col gap-2 overflow-hidden">
        {cards.map((title, i) => (
          <div key={i} className="w-full max-w-[12rem] rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            {i > 0 && <p className="text-[10px] font-medium uppercase tracking-wide text-violet-500">Generated</p>}
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
          // 這裡換成真正的 AI 呼叫
          await wait(1400);
          setCards((cs) => [...cs, "AI draft: a short bio"]);
        }}
      />

      <p aria-live="polite" className="absolute bottom-3 left-20 right-3 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-xs text-gray-600 backdrop-blur-xl">
        {tool ? hints[tool] : "Generate adds a card."}
      </p>
    </div>
  );
}
