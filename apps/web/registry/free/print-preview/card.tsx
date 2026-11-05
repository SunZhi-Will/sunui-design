"use client";

import { useState } from "react";

import { PrintPreview } from "./print-preview";

const roles = [
  ["Senior Frontend Engineer, Northwind Labs", "Rebuilt checkout in Next.js, cutting time to interactive from 4.1s to 1.6s.", "Designed a component library used by 6 product teams."],
  ["Frontend Engineer, Harbor Analytics", "Built a real-time dashboard rendering 50k points with canvas and workers.", "Brought the product to WCAG 2.1 AA across 30 screens."],
  ["Web Developer, Kiln & Co. Studio", "Shipped 25+ marketing and e-commerce sites for small businesses.", "Set up a headless CMS so clients publish without developer help."],
];

/** 型錄卡片：A4 分頁預覽，加入經歷就看內容依區塊自動換到下一頁。 */
export default function PrintPreviewCard() {
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(3);

  return (
    <div className="mx-auto w-[300px] space-y-2 rounded-xl bg-[#f3f4f6] p-2">
      <div className="flex items-center justify-between px-1 text-xs text-gray-500 tabular-nums">
        <span>{pages} pages</span>
        <button type="button" onClick={() => setCount((c) => (c >= 12 ? 3 : c + 3))} className="font-medium text-gray-700 underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          {count >= 12 ? "Reset" : "Add roles"}
        </button>
      </div>
      {/* 紙張是真實 A4 高度，放在內部捲動區裡瀏覽 */}
      <div className="h-[190px] overflow-y-auto overscroll-contain">
        <PrintPreview onPagesChange={setPages} padding="5mm" fontFamily="ui-sans-serif, system-ui, sans-serif">
          <h1 className="mt-0 mb-2 border-b-2 border-[#2563eb99] pb-2 text-[16pt] font-semibold tracking-tight text-gray-900">Mia Chen</h1>
          {Array.from({ length: count }, (_, i) => {
            const [title, ...points] = roles[i % roles.length];
            return (
              <div key={i}>
                <h3 className="mt-3 mb-1.5 border-l-[3px] border-[#2563eb] pl-2 leading-snug font-semibold text-gray-800">{title}</h3>
                <ul className="mb-2 list-disc space-y-1 pl-5 text-gray-700">
                  {points.map((p) => (
                    <li key={p} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </PrintPreview>
      </div>
    </div>
  );
}
