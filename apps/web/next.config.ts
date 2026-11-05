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
};

export default nextConfig;
