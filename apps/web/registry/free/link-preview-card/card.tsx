"use client";

import { LinkPreviewCard, type LinkPreviewData } from "./link-preview-card";

// 以內嵌 SVG 當作 og:image，不載入外部圖片
const ogImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="700" height="320" fill="url(#g)"/><g fill="#fff" fill-opacity=".9"><rect x="60" y="70" width="250" height="180" rx="16"/><rect x="340" y="70" width="300" height="24" rx="12" fill-opacity=".6"/><rect x="340" y="114" width="240" height="24" rx="12" fill-opacity=".45"/><rect x="340" y="158" width="270" height="24" rx="12" fill-opacity=".3"/></g><circle cx="185" cy="160" r="46" fill="#6366f1" fill-opacity=".85"/></svg>`,
)}`;

const url = "https://cardflow.app/blog/infinite-canvas";

// 模擬自己的 /api/link-preview：延遲後回傳 Open Graph 資料
const fetchPreview = () =>
  new Promise<LinkPreviewData>((resolve) =>
    setTimeout(() => resolve({ url, siteName: "CardFlow Blog", title: "An infinite canvas that stays out of the way", image: ogImage }), 1400),
  );

/** 型錄卡片：貼上一個網址，載入中後長出 Open Graph 預覽卡，滑過出現開啟按鈕。 */
export default function LinkPreviewCardCard() {
  return (
    <div className="mx-auto h-56 w-64">
      {/* 壓低 og:image 高度，整張卡放進型錄格 */}
      <LinkPreviewCard url={url} fetchPreview={fetchPreview} allowEmbed={false} className="[&_.h-40]:h-20" />
    </div>
  );
}
