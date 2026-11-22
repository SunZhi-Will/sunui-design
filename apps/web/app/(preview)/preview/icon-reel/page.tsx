import type { Metadata } from "next";

import { IconReel } from "./reel";

export const metadata: Metadata = {
  title: "Icon reel",
  robots: { index: false },
};

/**
 * 宣傳影片的錄製頁（2026-11-22）：1920 × 1080、黑底，12 秒一輪。
 * 只給錄影用，不進導覽。用 Playwright 錄 1920 × 1080，再以 ffmpeg 轉 mp4；網址加 ?wait 時由錄影腳本呼叫 window.__reelGo() 開始。
 * 結構照 reports/Kubai Icons 2.0 雙色版深度分析-2026-11-22.md 第 4.4 節：一句賣點、三面牆、跑馬燈夾標題。
 */
export default function IconReelPage() {
  return <IconReel />;
}
