import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// 主畫面圖示：紙色底加朱紅太陽，與 app/icon.svg 同一個標誌
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <svg width="120" height="120" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" fill="#0a0a0a" />
          <g stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
