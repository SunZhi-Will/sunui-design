import { ImageResponse } from "next/og";

import { orderCatalog } from "@/lib/catalog-order";
import { blockShot, Brand, ogContentType, ogSize, ShotFrame, siteHost } from "@/lib/og";
import { getItems } from "@/lib/registry";

// 整站（首頁）的分享圖。要放在 (site) 底下：app/ 根目錄的 opengraph-image 不會套到 (site) 這個 root layout。
// 左邊主標，右邊拼四張型錄最前面的 block 畫面（scripts/capture-og.mjs 截的）。
// 一張截圖都沒有時只顯示文字。
export const alt = "SunUI: paper-feel commerce blocks for React";
export const size = ogSize;
export const contentType = ogContentType;
// 建置時產生：讀 public/og 的截圖在執行期的 serverless 函式裡拿不到
export const dynamic = "force-static";

export default async function OpengraphImage() {
  const items = getItems();
  const shots: string[] = [];
  for (const item of orderCatalog(items)) {
    if (shots.length === 4) break;
    const shot = await blockShot(item.name);
    if (shot) shots.push(shot);
  }
  const mosaic = shots.length === 4;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: 40,
          padding: mosaic ? 40 : 80,
          background: "#ffffff",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: mosaic ? "28px 0 24px 28px" : 0,
          }}
        >
          <Brand size={mosaic ? 34 : 40} />
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontSize: mosaic ? 50 : 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              Coupons, receipts and stamps your shoppers can feel.
            </div>
            <div style={{ display: "flex", fontSize: mosaic ? 24 : 32, lineHeight: 1.35, color: "#6b6b6b" }}>
              {`${items.length} paper-feel commerce blocks · shadcn registry · accessible by default`}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#a3a3a3" }}>{siteHost()}</div>
        </div>
        {mosaic && (
          <div style={{ display: "flex", flexWrap: "wrap", width: 600, gap: 14 }}>
            {shots.map((src, i) => (
              <ShotFrame key={i} src={src} width={293} height={268} radius={18} />
            ))}
          </div>
        )}
      </div>
    ),
    size,
  );
}
