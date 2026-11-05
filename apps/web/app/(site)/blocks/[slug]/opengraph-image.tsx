import { ImageResponse } from "next/og";

import { getItem, getItems } from "@/lib/registry";

// 每個 block 單頁的分享預覽圖。貼到 LINE、Slack、X 時顯示 block 名稱與用途，
// 而不是整站共用的那張。標題用英文原文，避免 OG 字型缺 CJK 字形。
export const alt = "SunUI block";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

export default async function BlockOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const item = getItem((await params).slug);
  const title = item?.title ?? "SunUI";
  const description = item?.description ?? "";
  const isPro = item?.meta.tier === "pro";
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
          background: "#faf7f0",
          color: "#1c1917",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: "#c8361d" }} />
            SunUI
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 22px",
              borderRadius: 999,
              border: `3px solid ${isPro ? "#c8361d" : "#a8a29e"}`,
              color: isPro ? "#c8361d" : "#57534e",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {isPro ? "PRO" : "FREE · MIT"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, color: "#57534e", maxWidth: 1000 }}>
            {description.length > 140 ? `${description.slice(0, 137)}...` : description}
          </div>
          {whenToUse.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {whenToUse.map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#78716c" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "#c8361d" }} />
                  {line.length > 80 ? `${line.slice(0, 77)}...` : line}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#a8a29e" }}>
          {`npx shadcn add · paper-feel React + Tailwind blocks for commerce and campaign pages`}
        </div>
      </div>
    ),
    size,
  );
}
