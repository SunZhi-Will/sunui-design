import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 同一個資料夾同時開多個 dev server 時，各自指定輸出目錄，避免互相覆寫 .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // block 頁、MCP、registry 端點與四語文案都在執行期用 fs 讀原始碼（Pro 還要先驗授權），
  // 檔案追蹤看不出這種動態路徑，部署時要明確打包進每個 function，否則線上會 ENOENT
  outputFileTracingIncludes: {
    "/**": ["./registry/**/*", "./content/**/*", "./lib/**/*", "./registry.json"],
  },
  // 不走 Vercel 圖片優化：Hobby 每月 5,000 次轉換，超過就整個團隊停權（2026-11-25 已因 CPU 停過一次）。
  // 用到 next/image 的都是 public/ 裡預先截好、尺寸固定的海報與卡片圖，直接送原檔即可。
  // 見 reports/部署平台流量爆量與是否換平台深度分析-2026-11-26.md 第 7 節
  images: { unoptimized: true },
  // public/blocks/<block>/<檔名> 的示範照片給一週快取：預設的 max-age=0 會讓每個新掛上的 <img> 先回伺服器確認，
  // 翻頁、換系列這類動態會先畫出空白再補圖。只比對兩層的圖片路徑，/blocks/<slug> 區塊頁本身不受影響
  async headers() {
    return [
      {
        source: "/blocks/:block/:file((?:.+)\\.(?:webp|png|jpe?g|avif))",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
    ];
  },
};

export default nextConfig;
