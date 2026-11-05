"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { LinkPreviewCard, type LinkPreviewData } from "./link-preview-card";

// 以內嵌 SVG 當作 og:image，不載入外部圖片
const ogImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320"><rect width="700" height="320" fill="#44403c"/><rect x="60" y="64" width="250" height="192" rx="14" fill="#57534e"/><rect x="84" y="90" width="120" height="10" rx="5" fill="#d6d3d1"/><rect x="84" y="114" width="200" height="8" rx="4" fill="#78716c"/><rect x="84" y="132" width="170" height="8" rx="4" fill="#78716c"/><rect x="84" y="176" width="90" height="56" rx="8" fill="#78716c"/><rect x="186" y="176" width="100" height="56" rx="8" fill="#78716c"/><path d="M310 160 C360 120 380 210 430 170" stroke="#a8a29e" stroke-width="2" fill="none" stroke-dasharray="5 6"/><rect x="430" y="110" width="210" height="120" rx="14" fill="#57534e"/><rect x="454" y="136" width="140" height="10" rx="5" fill="#d6d3d1"/><rect x="454" y="160" width="160" height="8" rx="4" fill="#78716c"/><rect x="454" y="178" width="120" height="8" rx="4" fill="#78716c"/><rect x="454" y="206" width="36" height="4" rx="2" fill="#c8361d"/></svg>`,
)}`;

const url = "https://cardflow.app/blog/infinite-canvas";

const titles = {
  en: "An infinite canvas that stays out of the way",
  "zh-TW": "一張不礙事的無限畫布",
  "zh-CN": "一张不碍事的无限画布",
  ja: "邪魔をしない無限キャンバス",
};

/** 型錄卡片：貼上一個網址，載入中後長出 Open Graph 預覽卡，滑過出現開啟按鈕。 */
export default function LinkPreviewCardCard() {
  const locale = useDemoLocale();
  const title = useDemoText(titles);
  // 模擬自己的 /api/link-preview：延遲後回傳 Open Graph 資料
  const fetchPreview = () =>
    new Promise<LinkPreviewData>((resolve) => setTimeout(() => resolve({ url, siteName: "CardFlow Blog", title, image: ogImage }), 1400));

  return (
    <div className="mx-auto h-56 w-64">
      {/* 壓低 og:image 高度，整張卡放進型錄格；換語言時重新掛載以重新抓預覽 */}
      <LinkPreviewCard key={locale} url={url} fetchPreview={fetchPreview} allowEmbed={false} locale={locale} className="[&_.h-40]:h-20" />
    </div>
  );
}
