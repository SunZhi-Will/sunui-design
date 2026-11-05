"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { LinkPreviewCard, type LinkPreviewData } from "./link-preview-card";

// 以內嵌 SVG 當作 og:image，不載入外部圖片
const ogImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320"><rect width="700" height="320" fill="#44403c"/><rect x="60" y="64" width="250" height="192" rx="14" fill="#57534e"/><rect x="84" y="90" width="120" height="10" rx="5" fill="#d6d3d1"/><rect x="84" y="114" width="200" height="8" rx="4" fill="#78716c"/><rect x="84" y="132" width="170" height="8" rx="4" fill="#78716c"/><rect x="84" y="176" width="90" height="56" rx="8" fill="#78716c"/><rect x="186" y="176" width="100" height="56" rx="8" fill="#78716c"/><path d="M310 160 C360 120 380 210 430 170" stroke="#a8a29e" stroke-width="2" fill="none" stroke-dasharray="5 6"/><rect x="430" y="110" width="210" height="120" rx="14" fill="#57534e"/><rect x="454" y="136" width="140" height="10" rx="5" fill="#d6d3d1"/><rect x="454" y="160" width="160" height="8" rx="4" fill="#78716c"/><rect x="454" y="178" width="120" height="8" rx="4" fill="#78716c"/><rect x="454" y="206" width="36" height="4" rx="2" fill="#c8361d"/></svg>`,
)}`;

const url = "https://cardflow.app/blog/infinite-canvas";

const copy = {
  en: {
    title: "Designing an infinite canvas that never gets in the way",
    description: "Notes on pan, zoom, snapping and why every widget on the board stays draggable from its edges.",
  },
  "zh-TW": {
    title: "設計一張永遠不礙事的無限畫布",
    description: "關於平移、縮放、吸附，以及為什麼畫布上的每個元件都能從邊緣拖動的筆記。",
  },
  "zh-CN": {
    title: "设计一张永远不碍事的无限画布",
    description: "关于平移、缩放、吸附，以及为什么画布上的每个组件都能从边缘拖动的笔记。",
  },
  ja: {
    title: "決して邪魔をしない無限キャンバスの設計",
    description: "パン、ズーム、スナップ、そしてボード上のすべてのウィジェットを端からドラッグできる理由についてのメモ。",
  },
};

export default function LinkPreviewCardDemo() {
  const locale = useDemoLocale();
  // 換語言時重新掛載，重新抓預覽並清空自動補上的欄位
  return <Board key={locale} locale={locale} />;
}

function Board({ locale }: { locale: string }) {
  const t = useDemoText(copy);
  const [notes, setNotes] = useState({ title: "", description: "" });

  // 模擬自己的 /api/link-preview：延遲後回傳 Open Graph 資料
  const fetchPreview = () =>
    new Promise<LinkPreviewData>((resolve) =>
      setTimeout(() => resolve({ url, siteName: "CardFlow Blog", title: t.title, description: t.description, image: ogImage }), 1400),
    );

  return (
    <div className="w-full max-w-md min-w-0 rounded-xl border border-border bg-muted/50 p-4 sm:p-6">
      <div className="h-[360px] min-w-0">
        <LinkPreviewCard
          url={url}
          title={notes.title}
          description={notes.description}
          fetchPreview={fetchPreview}
          onAutoFill={(u) => setNotes((n) => ({ ...n, ...u }))}
          allowEmbed={false}
          locale={locale}
        />
      </div>
    </div>
  );
}
