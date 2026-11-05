"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { LinkPreviewCard, type LinkPreviewData } from "./link-preview-card";

// 以內嵌 SVG 當作 og:image，不載入外部圖片
const ogImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="700" height="320" fill="url(#g)"/><g fill="#fff" fill-opacity=".9"><rect x="60" y="70" width="250" height="180" rx="16"/><rect x="340" y="70" width="300" height="24" rx="12" fill-opacity=".6"/><rect x="340" y="114" width="240" height="24" rx="12" fill-opacity=".45"/><rect x="340" y="158" width="270" height="24" rx="12" fill-opacity=".3"/></g><circle cx="185" cy="160" r="46" fill="#6366f1" fill-opacity=".85"/></svg>`,
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
    <div className="w-full max-w-md min-w-0 rounded-xl bg-[#f3f4f6] p-4 sm:p-6">
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
