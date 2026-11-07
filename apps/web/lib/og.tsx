import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { siteUrl } from "@/lib/site";

// 分享預覽圖（OG）的共用零件。所有 opengraph-image.tsx 都從這裡組，版型一致、各頁內容不同。
// 文字一律英文：OG 預設字型沒有 CJK 字形。Satori 只吃 flex 版面，每個有多個子元素的 div 都要 display: flex。

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const ink = "#0a0a0a";
const muted = "#525252";
const faint = "#a3a3a3";
const line = "#e5e5e5";

export const siteHost = () => siteUrl().replace(/^https?:\/\//, "");

export const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text);

/**
 * scripts/capture-og.mjs 截下的 block 畫面，轉成 data URL 給 <img>。
 * 沒有截圖（新 block 還沒截、或 Pro 不在這台機器上）時回傳 null，呼叫端退回純文字版。
 */
export async function blockShot(name: string): Promise<string | null> {
  for (const [ext, mime] of [
    ["jpg", "image/jpeg"],
    ["png", "image/png"],
  ] as const) {
    const file = path.join(process.cwd(), "public", "og", "blocks", `${name}.${ext}`);
    if (existsSync(file)) return `data:${mime};base64,${(await readFile(file)).toString("base64")}`;
  }
  return null;
}

export function Brand({ size = 34 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.5, fontSize: size, fontWeight: 700, color: ink }}>
      <div style={{ width: size, height: size, borderRadius: 999, background: ink }} />
      SunUI
    </div>
  );
}

export function Pill({ children, strong = false, size = 24 }: { children: string; strong?: boolean; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        padding: `${size * 0.3}px ${size * 0.85}px`,
        borderRadius: 999,
        border: `3px solid ${strong ? ink : "#d4d4d4"}`,
        background: strong ? ink : "#ffffff",
        color: strong ? "#ffffff" : muted,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: 1.5,
      }}
    >
      {children}
    </div>
  );
}

/** 截圖畫框：淺灰底、細框、圓角，圖片 cover 填滿。 */
export function ShotFrame({ src, width, height, radius = 24 }: { src: string; width: number; height: number; radius?: number }) {
  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        borderRadius: radius,
        border: `2px solid ${line}`,
        overflow: "hidden",
        background: "#f5f5f5",
      }}
    >
      {/* Satori 只認 <img> */}
      <img src={src} width={width} height={height} style={{ width, height, objectFit: "cover", objectPosition: "center" }} alt="" />
    </div>
  );
}

/**
 * 一般頁面的分享圖：左上品牌、左下大標與副標，右側可放一組 chips 或一段指令，
 * 讓 pricing、docs、icons 等頁各自有辨識點，而不是整站同一張。
 */
export function pageOg({
  eyebrow,
  title,
  description,
  chips = [],
  command,
}: {
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  command?: string;
}) {
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
          backgroundImage: "radial-gradient(#e5e5e5 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          color: ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Brand />
          <div style={{ display: "flex", fontSize: 24, color: faint }}>{siteHost()}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 4, color: faint }}>{eyebrow.toUpperCase()}</div>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1000 }}>
            {clip(title, 60)}
          </div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.32, color: muted, maxWidth: 980 }}>{clip(description, 150)}</div>
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
              {chips.map((chip, i) => (
                <Pill key={chip} strong={i === 0}>
                  {chip}
                </Pill>
              ))}
            </div>
          )}
          {command && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                marginTop: 10,
                padding: "16px 26px",
                borderRadius: 16,
                background: ink,
                color: "#fafafa",
                fontSize: 26,
                fontFamily: "monospace",
              }}
            >
              {`$ ${command}`}
            </div>
          )}
        </div>
      </div>
    ),
    ogSize,
  );
}
