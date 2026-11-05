import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 同一個資料夾同時開多個 dev server 時，各自指定輸出目錄，避免互相覆寫 .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Pro route 在執行期才讀原始碼（要先驗授權），部署時要把檔案一起打包進 function
  outputFileTracingIncludes: {
    "/r/pro/[name]": ["./registry/pro/**/*", "./registry/free/**/*", "./registry.json"],
  },
};

export default nextConfig;
