import { siteUrl } from "@/lib/site";

/**
 * 媒體檔（public/cards 的卡片影片與卡片圖、public/og 的海報）放在 Cloudflare R2，不從主機送：
 * 這些檔佔了每位訪客約八成五的流量，R2 出站不收費。正式站設 NEXT_PUBLIC_MEDIA_URL（例如 https://media.synvize.com），
 * 本機不設就照舊讀 public/。檔案仍留在 repo：上傳來源是它們，海報有沒有也是看 public/og 判斷。
 * 上傳與同步：node apps/web/scripts/sync-media.mjs。
 * 見 reports/SunUI部署平台CP值與用戶規模預估-2026-11-26.md
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/$/, "");

/** path 以 / 開頭，例如 /cards/glow-dock.mp4 */
export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}${path}`;
}

/** 給站外讀的完整網址（port guide 這類純文字）：沒設媒體網址時退回網站網址 */
export function absoluteMediaUrl(path: string): string {
  return `${MEDIA_BASE || siteUrl()}${path}`;
}
