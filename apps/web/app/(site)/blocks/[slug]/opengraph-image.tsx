import { ImageResponse } from "next/og";

import { blockShot, Brand, clip, ogContentType, ogSize, Pill, ShotFrame, siteHost } from "@/lib/og";
import { getItem, getItems } from "@/lib/registry";
import { seriesLabels, seriesOf } from "@/lib/series";

// 每個 block 單頁的分享預覽圖：右邊是這個 block 自己的畫面（scripts/capture-og.mjs 截的），
// 左邊是名稱、系列、用途與安裝指令。沒有截圖時退回整張文字版。標題用英文原文，OG 字型缺 CJK 字形。
export const alt = "SunUI block";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

const interactionLabels: Record<string, string> = {
  press: "Press",
  hover: "Hover",
  drag: "Drag",
  type: "Type",
  loading: "Loading",
  scroll: "Scroll",
  section: "Section",
};

export default async function BlockOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const item = getItem(slug);
  const title = item?.title ?? "SunUI";
  const description = item?.description ?? "";
  const isPro = item?.meta.tier === "pro";
  const eyebrow = item
    ? [seriesLabels[seriesOf(item)], interactionLabels[item.meta.interaction]].filter(Boolean).join(" · ")
    : "";
  const install = isPro ? `npx shadcn add @sunui-pro/${slug}` : `npx shadcn add ${siteHost()}/r/${slug}.json`;
  const shot = item ? await blockShot(item.name) : null;

  const badge = <Pill strong={isPro}>{isPro ? "PRO" : "FREE · MIT"}</Pill>;

  if (shot) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            padding: 40,
            gap: 44,
            background: "#ffffff",
            color: "#0a0a0a",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 436, padding: "28px 0 24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Brand size={30} />
              {badge}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {eyebrow && (
                <div style={{ display: "flex", fontSize: 20, fontWeight: 700, letterSpacing: 3, color: "#a3a3a3" }}>{eyebrow.toUpperCase()}</div>
              )}
              <div style={{ display: "flex", fontSize: title.length > 22 ? 52 : 62, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.5 }}>
                {clip(title, 44)}
              </div>
              <div style={{ display: "flex", fontSize: 25, lineHeight: 1.36, color: "#525252" }}>{clip(description, 120)}</div>
            </div>
            <div style={{ display: "flex", fontSize: 17, color: "#737373", fontFamily: "monospace" }}>{clip(install, 46)}</div>
          </div>
          <ShotFrame src={shot} width={640} height={550} />
        </div>
      ),
      size,
    );
  }

  const whenToUse = item?.meta.usage?.whenToUse?.slice(0, 2) ?? [];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#ffffff",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Brand />
          {badge}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {eyebrow && <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#a3a3a3" }}>{eyebrow.toUpperCase()}</div>}
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, color: "#525252", maxWidth: 1000 }}>{clip(description, 140)}</div>
          {whenToUse.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {whenToUse.map((use) => (
                <div key={use} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#6b6b6b" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "#0a0a0a" }} />
                  {clip(use, 80)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#a3a3a3", fontFamily: "monospace" }}>{install}</div>
      </div>
    ),
    size,
  );
}
