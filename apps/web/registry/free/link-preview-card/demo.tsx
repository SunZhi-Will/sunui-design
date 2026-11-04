"use client";

import { useState } from "react";

import { LinkPreviewCard, type LinkPreviewData } from "./link-preview-card";

// 以內嵌 SVG 當作 og:image，不載入外部圖片
const ogImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="700" height="320" fill="url(#g)"/><g fill="#fff" fill-opacity=".9"><rect x="60" y="70" width="250" height="180" rx="16"/><rect x="340" y="70" width="300" height="24" rx="12" fill-opacity=".6"/><rect x="340" y="114" width="240" height="24" rx="12" fill-opacity=".45"/><rect x="340" y="158" width="270" height="24" rx="12" fill-opacity=".3"/></g><circle cx="185" cy="160" r="46" fill="#6366f1" fill-opacity=".85"/></svg>`,
)}`;

// 模擬自己的 /api/link-preview：延遲後回傳 Open Graph 資料
const fakeOg: Record<string, LinkPreviewData> = {
  "https://cardflow.app/blog/infinite-canvas": {
    url: "https://cardflow.app/blog/infinite-canvas",
    siteName: "CardFlow Blog",
    title: "Designing an infinite canvas that never gets in the way",
    description: "Notes on pan, zoom, snapping and why every widget on the board stays draggable from its edges.",
    image: ogImage,
  },
};

const fetchPreview = (url: string) =>
  new Promise<LinkPreviewData>((resolve, reject) => {
    setTimeout(() => (fakeOg[url] ? resolve(fakeOg[url]) : reject(new Error("404"))), 1400);
  });

export default function LinkPreviewCardDemo() {
  const [notes, setNotes] = useState({ title: "", description: "" });

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-6 rounded-xl bg-[#f3f4f6] p-4 sm:grid-cols-2 sm:p-6">
      <div className="h-[360px] min-w-0">
        <LinkPreviewCard
          url="https://cardflow.app/blog/infinite-canvas"
          title={notes.title}
          description={notes.description}
          fetchPreview={fetchPreview}
          onAutoFill={(u) => setNotes((n) => ({ ...n, ...u }))}
          allowEmbed={false}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="h-[200px] min-w-0">
          <LinkPreviewCard
            url="https://x.com/cardflow/status/1850000000000000000"
            title="Release thread"
            preview={{
              url: "https://x.com/cardflow/status/1850000000000000000",
              siteName: "X (formerly Twitter)",
              title: "CardFlow 0.9 is out: markdown cards and link previews",
              description: "Drop any URL on the board and it turns into a card. Double-click to open it.",
            }}
            allowEmbed={false}
          />
        </div>
        <div className="h-[200px] min-w-0">
          <LinkPreviewCard
            url="https://docs.internal.example/handbook/onboarding"
            title="Onboarding handbook"
            description="First-week checklist, accounts to request and who to ask."
            fetchPreview={fetchPreview}
            allowEmbed={false}
          />
        </div>
      </div>
    </div>
  );
}
