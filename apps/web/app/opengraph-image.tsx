import { ImageResponse } from "next/og";

import { getItems } from "@/lib/registry";

export const alt = "SunUI: animated blocks for campaigns that convert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const count = getItems().length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 60%, #431407 100%)",
          color: "#fafaf9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "#fb923c" }} />
          SunUI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Animated blocks for campaigns that convert.
          </div>
          <div style={{ fontSize: 32, color: "#a8a29e" }}>
            {`${count} React + Tailwind blocks · shadcn registry · accessible by default`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
