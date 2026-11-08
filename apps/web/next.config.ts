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
