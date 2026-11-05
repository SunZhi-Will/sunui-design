import { ImageResponse } from "next/og";

import { getItems } from "@/lib/registry";

export const alt = "SunUI: paper-feel commerce blocks for React";
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
          background: "#ffffff",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "#0a0a0a" }} />
          SunUI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Coupons, receipts and stamps your shoppers can feel.
          </div>
          <div style={{ fontSize: 32, color: "#6b6b6b" }}>
            {`${count} paper-feel commerce blocks · shadcn registry · accessible by default`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
